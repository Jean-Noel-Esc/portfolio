import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const MovieContainer = styled.div`
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
  flex-direction: column;
  align-items: center;
  width: 80%;
  max-width: 600px;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-family: 'CustomFont2', sans-serif;
  margin: 0;
  padding: 1rem;
  border: 2px solid white;
  width: 100%;
  text-align: center;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
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
  height: 3.5rem;
  margin-top: 1rem;
  font-size: 1.5rem;
  
  &:hover {
    background-color: white;
    color: black;
  }
`;

const ComingSoon = styled.h2`
  font-family: 'CustomFont2', sans-serif;
  font-size: 2rem;
  color: white;
  text-align: center;
  margin-top: 2rem;
`;

const MoviePage = () => {
  const navigate = useNavigate();

  return (
    <MovieContainer>
      <Header>
        <Title>Movies</Title>
        <BackButton onClick={() => navigate('/menu')}>Back to Menu</BackButton>
      </Header>
      <ComingSoon>Coming Soon</ComingSoon>
    </MovieContainer>
  );
};

export default MoviePage;