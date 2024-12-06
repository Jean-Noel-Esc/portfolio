import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

const AdminContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: black;
  color: white;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-family: 'CustomFont2', sans-serif;
`;

const BackButton = styled.button`
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: white;
    color: black;
  }
`;

const AdminGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AdminSection = styled.div`
  border: 2px solid #4CAF50;
  padding: 2rem;
  border-radius: 8px;
  
  h2 {
    margin-bottom: 1rem;
    color: #4CAF50;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SubmitButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #45a049;
  }
`;

const AddTrackButton = styled.button`
  padding: 0.5rem;
  font-size: 0.9rem;
  background-color: #007BFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #0056b3;
  }
`;

const AdminPanel = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [albumName, setAlbumName] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [albumImage, setAlbumImage] = useState(null);
  const [tracks, setTracks] = useState([null]);

  // Protect the route
  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/menu');
    }
  }, [isAdmin, navigate]);

  const handleTrackChange = (index, file) => {
    const newTracks = [...tracks];
    newTracks[index] = file;
    setTracks(newTracks);
  };

  const addTrackInput = () => {
    setTracks([...tracks, null]);
  };

  const handleAddAlbum = async (e) => {
    e.preventDefault();
    
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        navigate('/');
        return;
    }

    const formData = new FormData();
    formData.append('title', albumName);
    formData.append('cover_image', albumImage);

    // Append each track to the form data
    tracks.forEach((track, index) => {
        if (track) {
            formData.append('tracks', track);  // Ensure 'tracks' matches the field name in multer
        }
    });

    try {
        // Add album with tracks
        const albumResponse = await axios.post(`${API_URL}/admin/albums`, formData, {
          headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`,
          },
      });

        console.log('Album and tracks added successfully:', albumResponse.data);
        
        // Reset form
        setAlbumName('');
        setAlbumDescription('');
        setAlbumImage(null);
        setTracks([null]);
        
        alert('Album added successfully!');
        
    } catch (error) {
        console.error('Error adding album:', error);
        
        if (error.response) {
            if (error.response.status === 401) {
                alert('Session expired. Please log in again.');
                localStorage.removeItem('token');
                localStorage.removeItem('isAdmin');
                navigate('/');
            } else {
                alert(`Error: ${error.response.data.error || 'Failed to add album'}`);
            }
        } else {
            alert('Network error. Please try again.');
        }
    }
};

  return (
    <AdminContainer>
      <Header>
        <Title>Admin Panel</Title>
        <BackButton onClick={() => navigate('/menu')}>Back to Menu</BackButton>
      </Header>
      
      <AdminGrid>
        <AdminSection>
          <h2>Manage Movies</h2>
          <button>Add New Movie</button>
          {/* Movie management features will go here */}
        </AdminSection>
        
        <AdminSection>
          <h2>Manage Music</h2>
          <Form onSubmit={handleAddAlbum}>
            <Input
              type="text"
              placeholder="Album Name"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Album Description"
              value={albumDescription}
              onChange={(e) => setAlbumDescription(e.target.value)}
              required
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setAlbumImage(e.target.files[0])}
              required
            />
            {tracks.map((track, index) => (
              <Input
                key={index}
                type="file"
                accept="audio/*"
                onChange={(e) => handleTrackChange(index, e.target.files[0])}
                required
              />
            ))}
            <AddTrackButton type="button" onClick={addTrackInput}>Add Another Track</AddTrackButton>
            <SubmitButton type="submit">Add New Album</SubmitButton>
          </Form>
        </AdminSection>
      </AdminGrid>
    </AdminContainer>
  );
};

export default AdminPanel;