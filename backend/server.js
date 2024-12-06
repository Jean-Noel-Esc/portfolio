require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const B2 = require('backblaze-b2');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Configure B2
const b2 = new B2({
    applicationKeyId: process.env.B2_KEY_ID,
    applicationKey: process.env.B2_APPLICATION_KEY
});

// Update the PostgreSQL configuration
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE
});

// Admin login endpoint
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM admin_users WHERE username = $1',
            [username]
        );
        
        const admin = result.rows[0];
        
        if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Middleware to protect admin routes
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('No token provided');
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err);
            return res.sendStatus(401);
        }
        req.user = user;
        next();
    });
};

// Verify access code endpoint
app.post('/verify-code', async (req, res) => {
    const { code } = req.body;
    
    try {
        console.log('Received code:', code);

        // First check admin_users table for admin code
        const adminQuery = `
            SELECT id, username 
            FROM admin_users 
            WHERE admin_code = $1
        `;
        
        const adminResult = await pool.query(adminQuery, [code]);
        console.log('Admin query result:', adminResult.rows);

        if (adminResult.rows.length > 0) {
            const admin = adminResult.rows[0];
            const token = jwt.sign(
                { 
                    id: admin.id,
                    username: admin.username,
                    isAdmin: true 
                },
                process.env.JWT_SECRET,  // Replace with actual JWT_SECRET from env
                { expiresIn: '24h' }
            );

            return res.json({ 
                token,
                isAdmin: true
            });
        }

        // If not admin, check regular users table
        const userQuery = `
            SELECT id, code, is_admin 
            FROM users 
            WHERE code = $1
        `;
        
        const userResult = await pool.query(userQuery, [code]);
        console.log('User query result:', userResult.rows);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid code' });
        }

        const user = userResult.rows[0];
        const token = jwt.sign(
            { 
                userId: user.id,
                isAdmin: user.is_admin 
            },
            process.env.JWT_SECRET,  // Replace with actual JWT_SECRET from env
            { expiresIn: '7d' }
        );

        res.json({ 
            token,
            isAdmin: user.is_admin
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// Get download URL endpoint
app.get('/download/:fileName(*)', async (req, res) => {
    try {
        // Authorize with B2
        await b2.authorize();
        
        // Clean the fileName
        const fileName = req.params.fileName
            .replace(/^[\/\\]+|[\/\\]+$/g, '') // Remove leading/trailing slashes
            .replace(/\\/g, '/'); // Convert backslashes to forward slashes

        console.log('Attempting to get download URL for:', fileName);

        try {
            // Get download authorization
            const authToken = await b2.getDownloadAuthorization({
                bucketId: process.env.B2_BUCKET_ID,
                fileNamePrefix: fileName,
                validDurationInSeconds: 3600
            });

            // Construct the download URL with authorization
            const downloadUrl = `https://f003.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}?Authorization=${authToken.data.authorizationToken}`;

            res.json({ downloadUrl });
        } catch (fileError) {
            console.error('File not found in B2:', fileName);
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to generate download URL' });
    }
});

// Create new album with tracks
// Create new album with tracks
app.post('/admin/albums', authenticateAdmin, upload.fields([
    { name: 'cover_image', maxCount: 1 },
    { name: 'tracks', maxCount: 10 }
]), async (req, res) => {
    try {
        const { title } = req.body;
        console.log('Received album creation request:', { title });
        
        // Authorize with B2
        await b2.authorize();
        console.log('B2 Authorization successful');
        
        // Handle cover image
        const coverImage = req.files['cover_image'][0];
        const coverImageName = `${Date.now()}-${coverImage.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        console.log('Processing cover image:', coverImageName);
        
        // Upload cover image to B2
        const coverImageBuffer = fs.readFileSync(coverImage.path);
        const { data: coverUploadUrl } = await b2.getUploadUrl({
            bucketId: process.env.B2_BUCKET_ID
        });

        await b2.uploadFile({
            uploadUrl: coverUploadUrl.uploadUrl,
            uploadAuthToken: coverUploadUrl.authorizationToken,
            fileName: coverImageName,
            data: coverImageBuffer,
            contentLength: coverImage.size,
            contentType: coverImage.mimetype
        });
        console.log('Cover image uploaded successfully');

        // Create album in database
        const albumResult = await pool.query(
            'INSERT INTO albums (title, cover_image_path) VALUES ($1, $2) RETURNING id',
            [title, coverImageName]
        );
        const albumId = albumResult.rows[0].id;
        console.log('Album created in database with ID:', albumId);

        // Handle tracks
        console.log('Starting track upload process');
        const tracks = req.files['tracks'] || [];
        console.log(`Number of tracks to upload: ${tracks.length}`);

        for (let i = 0; i < tracks.length; i++) {
            try {
                const track = tracks[i];
                const trackName = `${Date.now()}-${track.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                console.log(`Processing track ${i + 1}/${tracks.length}: ${trackName}`);
                
                // Get upload URL for track
                const { data: trackUploadUrl } = await b2.getUploadUrl({
                    bucketId: process.env.B2_BUCKET_ID
                });
                console.log('Got B2 upload URL for track');

                // Read track file
                const trackBuffer = fs.readFileSync(track.path);
                console.log('Track file read successfully');

                // Upload track to B2
                await b2.uploadFile({
                    uploadUrl: trackUploadUrl.uploadUrl,
                    uploadAuthToken: trackUploadUrl.authorizationToken,
                    fileName: trackName,
                    data: trackBuffer,
                    contentLength: track.size,
                    contentType: track.mimetype
                });
                console.log(`Track ${i + 1} uploaded to B2 successfully`);

                // Save track in database
                await pool.query(
                    'INSERT INTO tracks (album_id, title, track_number, file_path, b2_file_name) VALUES ($1, $2, $3, $4, $5)',
                    [
                        albumId,
                        track.originalname,
                        i + 1,
                        trackName,
                        trackName
                    ]
                );
                console.log(`Track ${i + 1} saved to database`);

                // Clean up temporary file
                fs.unlinkSync(track.path);
                console.log(`Temporary file cleaned up for track ${i + 1}`);

            } catch (trackError) {
                console.error(`Error processing track ${i + 1}:`, trackError);
                // Continue with next track instead of failing completely
            }
        }

        // Clean up cover image temporary file
        fs.unlinkSync(coverImage.path);
        console.log('Cover image temporary file cleaned up');

        console.log('Album creation completed successfully');
        res.json({ 
            success: true, 
            albumId, 
            message: 'Album created successfully' 
        });

    } catch (error) {
        console.error('Error creating album:', error);
        res.status(500).json({ error: 'Failed to create album' });
    }
});

// Get all albums with tracks
app.get('/albums', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                a.id, 
                a.title, 
                a.cover_image_path,
                json_agg(
                    json_build_object(
                        'id', t.id,
                        'title', t.title,
                        'track_number', t.track_number,
                        'file_path', t.file_path
                    ) ORDER BY t.track_number
                ) as tracks
            FROM albums a
            LEFT JOIN tracks t ON a.id = t.album_id
            GROUP BY a.id, a.title, a.cover_image_path
            ORDER BY a.id DESC
        `);

        // Filter out null tracks from the tracks array
        const albums = result.rows.map(album => ({
            ...album,
            tracks: album.tracks.filter(track => track && track.id !== null)
        }));

        res.json(albums);
    } catch (error) {
        console.error('Error fetching albums:', error);
        res.status(500).json({ error: 'Failed to fetch albums' });
    }
});

// Get all movies
app.get('/movies', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM movies ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Add this endpoint to clean up missing files
app.post('/admin/cleanup-files', authenticateAdmin, async (req, res) => {
    try {
        // Get all files from database
        const albums = await pool.query('SELECT id, cover_image_path FROM albums');
        const tracks = await pool.query('SELECT id, file_path FROM tracks');

        // Check each file and remove if it doesn't exist in B2
        for (const album of albums.rows) {
            if (!(await checkFileExistsInB2(album.cover_image_path))) {
                await pool.query('DELETE FROM albums WHERE id = $1', [album.id]);
            }
        }

        for (const track of tracks.rows) {
            if (!(await checkFileExistsInB2(track.file_path))) {
                await pool.query('DELETE FROM tracks WHERE id = $1', [track.id]);
            }
        }

        res.json({ message: 'Cleanup completed successfully' });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ error: 'Cleanup failed' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});