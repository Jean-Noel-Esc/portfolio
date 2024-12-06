import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

const LandingContainer = styled.div`
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
  margin-bottom: 2rem;
  font-size: 1.6rem;
`;

const CodeInput = styled.input`
  width: 200px;
  padding: 1rem;
  font-size: 1.5rem;
  text-align: center;
  background: transparent;
  border: 2px solid white;
  color: white;
  letter-spacing: 0.5rem;
  margin-bottom: 1rem;
  font-family: 'CustomFont2', sans-serif;
  
  &:focus {
    outline: none;
    border-color: #666;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const ErrorMessage = styled.p`
  color: #ff4444;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SubmitButton = styled.button`
  background: transparent;
  border: 2px solid white; /* White border */
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s ease;
  font-family: 'CustomFont2', sans-serif; /* Use CustomFont2 */
  width: 100%; /* Full width of the form */
  padding: 1rem; /* Add padding for better appearance */
  box-sizing: border-box; /* Ensure padding doesn't affect width */

  &:hover {
    opacity: 1;
  }
`;

const LandingPage = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length === 6) {
      try {
        const response = await axios.post('http://localhost:5000/verify-code', { code });
        
        // Store token and admin status
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('isAdmin', response.data.isAdmin);

        // Redirect to menu
        navigate('/menu');
      } catch (error) {
        setError('Invalid code');
        setCode(''); // Clear the input on error
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
    if (value.length <= 6) {
      setCode(value);
      setError(''); // Clear error when user starts typing
    }
  };

  return (
    <LandingContainer>
      <Title>CHROME PIRATE</Title>
      <Form onSubmit={handleSubmit}>
        <CodeInput
          type="text"
          maxLength="6"
          value={code}
          onChange={handleInputChange}
          placeholder="______"
          autoFocus
        />
        <SubmitButton type="submit">
          Enter
        </SubmitButton>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </Form>
    </LandingContainer>
  );
};

export default LandingPage;