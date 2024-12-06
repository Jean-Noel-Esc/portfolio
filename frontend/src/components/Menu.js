import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const MenuContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: black;
  color: white;
`;

const Title = styled.h1`
  font-family: 'CustomFont2', sans-serif;
  margin-bottom: 3rem;
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MenuButton = styled(Link)`
  padding: 2rem 4rem;
  font-family: 'CustomFont2', sans-serif;
  font-size: 1.5rem;
  text-decoration: none;
  color: white;
  border: 2px solid white;
  transition: all 0.3s ease;
  text-align: center;
  
  &:hover {
    background-color: white;
    color: black;
  }
`;

const LogoutButton = styled.button`
  grid-column: 1 / -1;  // Makes the logout button span full width
  padding: 2rem 4rem;
  font-family: 'CustomFont2', sans-serif;
  font-size: 1.5rem;
  text-decoration: none;
  color: white;
  border: 2px solid white;
  transition: all 0.3s ease;
  text-align: center;
  background: transparent;
  cursor: pointer;
  
  &:hover {
    background-color: white;
    color: black;
  }
`;

const AdminButton = styled(MenuButton)`
  grid-column: 1 / -1;  // Makes the admin button span full width
  border-color: #4CAF50;
  color: #4CAF50;
  
  &:hover {
    background-color: #4CAF50;
    color: white;
  }
`;

const Menu = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    // Redirect to landing page
    navigate('/');
  };

  // Redirect if not logged in
  React.useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <MenuContainer>
      <Title>Choose Your Experience</Title>
      <MenuGrid>
        <MenuButton to="/movies">Movies</MenuButton>
        <MenuButton to="/music">Musics</MenuButton>
        {isAdmin && <AdminButton to="/admin">Admin Panel</AdminButton>}
        <LogoutButton onClick={handleLogout}>Log Out</LogoutButton>
      </MenuGrid>
    </MenuContainer>
  );
};

export default Menu;