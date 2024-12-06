import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import CustomAudioPlayer from './CustomAudioPlayer';

const MusicContainer = styled.div`
  padding: 2rem;
  background-color: black;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column; /* Stack items vertically */
  align-items: center; /* Center items horizontally */
  width: 80%; /* Match AlbumCard width */
  max-width: 600px; /* Match AlbumCard max-width */
  margin-bottom: 1rem;

`;

const Title = styled.h1`
  font-family: 'CustomFont2', sans-serif;
  margin: 0;
  padding: 1rem; /* Increased padding */
  border: 2px solid white;
  width: 100%;
  text-align: center;
  height: 3.5rem; /* Match height */
  display: flex; /* Added to center text vertically */
  align-items: center; /* Center text vertically */
  justify-content: center; /* Center text horizontally */
  font-size: 2.5rem; /* Bigger text */
`;

const BackButton = styled.button`
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'CustomFont2', sans-serif;
  width: 100%;
  height: 3.5rem; /* Match height */
  margin-top: 1rem;
  font-size: 1.5rem; /* Bigger text */
  
  &:hover {
    background-color: white;
    color: black;
  }
`;

const AlbumCard = styled.div`
  border: 1px solid #ccc;
  background-color: black;
  overflow: hidden;
  width: 80%;
  max-width: 600px;
  margin-bottom: 1rem;
`;

const AlbumImage = styled.img`
  width: 100%;
  height: auto;
`;

const AlbumInfo = styled.div`
  padding: 1rem;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  width: 80%; /* Match AlbumCard width */
  max-width: 600px; /* Match AlbumCard max-width */
`;

const NavButton = styled.button`
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 1rem 1rem; /* Increased vertical padding */
  height: 5.5rem; /* Added explicit height */
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'CustomFont2', sans-serif;
  width: 49%; /* Take up almost half the space, leaving a small gap between buttons */
  font-size: 1.5rem; /* Increased font size */
  
  &:hover {
    background-color: white;
    color: black;
  }
`;
// Add this function before the MusicPage component
const cleanPath = (path) => {
  return encodeURIComponent(path.replace(/\\/g, '/'));
};



const MusicPage = () => {
  const [albums, setAlbums] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const navigate = useNavigate();

  const handleTrackSelect = (track) => {
    setCurrentTrack(track);
  };

  const handleNextAlbum = () => {
    setCurrentAlbumIndex((prevIndex) => (prevIndex + 1) % albums.length);
  };

  const handlePreviousAlbum = () => {
    setCurrentAlbumIndex((prevIndex) => (prevIndex - 1 + albums.length) % albums.length);
  };

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        console.log('Fetching albums from:', `${API_URL}/albums`);
        const response = await axios.get(`${API_URL}/albums`);
        console.log('Albums response:', response.data);
        setAlbums(response.data);
        
        const urlPromises = response.data.flatMap(album => {
          const promises = [];
          
          if (album.cover_image_path) {
            const cleanedPath = cleanPath(album.cover_image_path);
            promises.push(
              axios.get(`http://localhost:5000/download/${cleanedPath}`)
                .then(res => ({ 
                  path: album.cover_image_path, 
                  url: res.data.downloadUrl 
                }))
                .catch(error => {
                  console.error(`Failed to get signed URL for ${cleanedPath}:`, error);
                  return null;
                })
            );
          }
          
          if (album.tracks) {
            album.tracks.forEach(track => {
              if (track && track.file_path) {
                const cleanedPath = cleanPath(track.file_path);
                promises.push(
                  axios.get(`http://localhost:5000/download/${cleanedPath}`)
                    .then(res => ({ 
                      path: track.file_path, 
                      url: res.data.downloadUrl 
                    }))
                    .catch(error => {
                      console.error(`Failed to get signed URL for ${cleanedPath}:`, error);
                      return null;
                    })
                );
              }
            });
          }
          
          return promises;
        });

        const urls = await Promise.all(urlPromises);
        const urlMap = urls.reduce((acc, item) => {
          if (item) {
            acc[item.path] = item.url;
          }
          return acc;
        }, {});
        
        setSignedUrls(urlMap);
      } catch (error) {
        console.error('Error fetching albums:', error);
      }
    };

    fetchAlbums();
  }, []);

  const currentAlbum = albums[currentAlbumIndex];

  return (
    <MusicContainer>
      <Header>
        <Title>Musics</Title>
        <BackButton onClick={() => navigate('/menu')}>Back to Menu</BackButton>
      </Header>
      {currentAlbum && (
        <AlbumCard>
          {currentAlbum.cover_image_path && signedUrls[currentAlbum.cover_image_path] && (
            <AlbumImage 
              src={signedUrls[currentAlbum.cover_image_path]}
              alt={currentAlbum.title}
              onError={(e) => {
                console.error('Failed to load image:', currentAlbum.cover_image_path);
                e.target.style.display = 'none';
              }}
            />
          )}
          <AlbumInfo>
            {currentAlbum.tracks && currentAlbum.tracks.length > 0 && (
              <CustomAudioPlayer
                tracks={currentAlbum.tracks}
                currentTrack={currentTrack}
                signedUrls={signedUrls}
                onTrackSelect={handleTrackSelect}
              />
            )}
          </AlbumInfo>
        </AlbumCard>
      )}
      <NavigationButtons>
        <NavButton onClick={handlePreviousAlbum}>Previous</NavButton>
        <NavButton onClick={handleNextAlbum}>Next</NavButton>
      </NavigationButtons>
    </MusicContainer>
  );
};

export default MusicPage;