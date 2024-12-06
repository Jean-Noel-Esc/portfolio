import React from 'react';
import H5AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import styled from 'styled-components';

const PlayerWrapper = styled.div`
  .rhap_container {
    background-color: Black;
    border: 2px solid white; /* White border */
  }

  .rhap_time, .rhap_current-time {
    color: #fff;
  }

  .rhap_progress-filled {
    background-color: #4CAF50;
  }

  .rhap_progress-indicator, .rhap_volume-indicator {
    background: #4CAF50;
  }

  .rhap_button-clear {
    color: #fff;
    &:hover {
      color: #4CAF50;
    }
  }
`;

const TrackList = styled.div`
  margin-top: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
`;

const TrackItem = styled.div`
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  border-bottom: 1px solid white;
  color: #fff; /* Default text color */

  &:hover {
    background-color: white; /* Change background to white on hover */
    color: black; /* Change text color to black on hover */
  }
  
  &.active {
    /* background-color: #444; */
    color: #4CAF50;
  }
`;

const CustomAudioPlayer = ({ tracks, currentTrack, signedUrls, onTrackSelect }) => {
  const handleClickNext = () => {
    if (!tracks || tracks.length === 0) return;
    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    onTrackSelect(tracks[nextIndex]);
  };

  const handleClickPrevious = () => {
    if (!tracks || tracks.length === 0) return;
    const currentIndex = tracks.findIndex(track => track.id === currentTrack?.id);
    const previousIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    onTrackSelect(tracks[previousIndex]);
  };
  
  const formatTrackTitle = (title) => {
    return title.replace('.mp3', ''); // Remove .mp3 extension
  };

  return (
    <PlayerWrapper>
      <H5AudioPlayer
        src={currentTrack ? signedUrls[currentTrack.file_path] : ''}
        onClickNext={handleClickNext}
        onClickPrevious={handleClickPrevious}
        showSkipControls={true}
        showJumpControls={false}
        onEnded={handleClickNext}
        autoPlayAfterSrcChange={true}
        customProgressBarSection={["PROGRESS_BAR", "CURRENT_TIME", "DURATION"]}
      />
      <TrackList>
        {tracks.map((track) => (
          <TrackItem
            key={track.id}
            onClick={() => onTrackSelect(track)}
            className={currentTrack?.id === track.id ? 'active' : ''}
          >
            {track.track_number}. {formatTrackTitle(track.title)}
          </TrackItem>
        ))}
      </TrackList>
    </PlayerWrapper>
  );
};

export default CustomAudioPlayer;