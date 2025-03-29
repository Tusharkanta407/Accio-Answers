import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Container,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import Peer from 'peerjs';
import * as faceapi from 'face-api.js';

const VideoGame = ({ game, player, onAnswer, isGameEnded, socket, roomId }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [peerId, setPeerId] = useState(null);
  const [peer, setPeer] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [peerError, setPeerError] = useState(null);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const canvasRef = useRef();
  const timerRef = useRef(null);

  const initializeVideo = useCallback(async () => {
    try {
      console.log('Requesting camera access...');
      
      // Check if running in a secure context (HTTPS or localhost)
      const isSecureContext = window.location.protocol === 'https:' || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1';

      if (!isSecureContext) {
        // Try to redirect to localhost if not already there
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          const localhostUrl = `http://localhost:${window.location.port}${window.location.pathname}`;
          window.location.href = localhostUrl;
          return;
        }
        throw new Error('Camera access requires a secure connection (HTTPS) or localhost. Please use HTTPS or run locally.');
      }

      // Check browser compatibility
      if (!navigator.mediaDevices) {
        throw new Error('Your browser does not support camera access. Please try using Chrome, Firefox, or Edge.');
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices.getUserMedia) {
        // Try legacy getUserMedia
        const getUserMedia = navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia ||
          navigator.msGetUserMedia;

        if (!getUserMedia) {
          throw new Error('Your browser does not support camera access. Please try using Chrome, Firefox, or Edge.');
        }
      }

      // Try to get camera access with fallback options
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: true
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Camera access granted');
        setLocalStream(stream);
        initializePeer(stream);
      } catch (error) {
        // Try fallback with basic constraints
        const fallbackConstraints = {
          video: true,
          audio: true
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        console.log('Camera access granted with fallback constraints');
        setLocalStream(stream);
        initializePeer(stream);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Failed to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = `
          Camera access was denied. Please:
          1. Click the camera icon in your browser's address bar
          2. Select "Allow" for camera access
          3. Refresh the page
        `;
      } else if (error.name === 'NotFoundError') {
        errorMessage = `
          No camera found. Please:
          1. Make sure your camera is properly connected
          2. Check if another application is using the camera
          3. Try using a different browser
        `;
      } else if (error.name === 'NotReadableError') {
        errorMessage = `
          Camera is in use by another application. Please:
          1. Close other applications that might be using the camera
          2. Check if your camera is working in other applications
          3. Try refreshing the page
        `;
      } else if (error.message.includes('secure connection')) {
        errorMessage = `
          Camera access requires a secure connection. Please:
          1. Use HTTPS or run the application locally
          2. If running locally, make sure you're using localhost
          3. Try accessing the application at http://localhost:3000
        `;
      } else {
        errorMessage += `
          ${error.message}
          Please try:
          1. Using a different browser (Chrome, Firefox, or Edge)
          2. Checking your camera permissions
          3. Refreshing the page
        `;
      }

      // Show error in a more user-friendly way
      const errorBox = document.createElement('div');
      errorBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        max-width: 400px;
      `;
      errorBox.innerHTML = `
        <h3 style="color: #d32f2f; margin-bottom: 15px;">Camera Access Error</h3>
        <p style="white-space: pre-line; margin-bottom: 20px;">${errorMessage}</p>
        <button onclick="this.parentElement.remove()" style="
          background: #1976d2;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">Close</button>
      `;
      document.body.appendChild(errorBox);
    }
  }, []);

  const initializePeer = async (stream) => {
    try {
      const host = window.location.hostname === 'localhost' ? 'localhost' : '172.168.169.221';
      const port = 3001;
      
      const peer = new Peer(null, {
        host,
        port,
        path: '/peerjs',
        secure: false,
        debug: 3,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        }
      });

      peer.on('open', (id) => {
        console.log('My peer ID is:', id);
        setPeerId(id);
        setPeer(peer);
        setIsConnected(true);
      });

      peer.on('error', (error) => {
        console.error('Peer error:', error);
        setPeerError(error);
      });

      peer.on('disconnected', () => {
        console.log('Peer disconnected, attempting to reconnect...');
        peer.reconnect();
      });

      peer.on('close', () => {
        console.log('Peer connection closed');
        setIsConnected(false);
      });

      peer.on('call', (call) => {
        console.log('Received call from:', call.peer);
        call.answer(stream);
        call.on('stream', (remoteStream) => {
          console.log('Received remote stream');
          setRemoteStream(remoteStream);
        });
      });

      return peer;
    } catch (error) {
      console.error('Error initializing peer:', error);
      setPeerError(error);
      return null;
    }
  };

  // Add socket event listeners for peer connection
  useEffect(() => {
    if (!socket) return;

    const handlePeerReady = (data) => {
      console.log('Peer ready:', data);
      if (peer && data.peerId) {
        const call = peer.call(data.peerId, localStream);
        call.on('stream', (remoteStream) => {
          console.log('Received remote stream from call');
          setRemoteStream(remoteStream);
          setIsLoading(false);
        });
        call.on('close', () => {
          console.log('Call closed');
          setRemoteStream(null);
        });
      }
    };

    socket.on('peer-ready', handlePeerReady);

    return () => {
      socket.off('peer-ready', handlePeerReady);
    };
  }, [socket, localStream]);

  const initializeFaceDetection = useCallback(async () => {
    try {
      console.log('Loading face detection models...');
      
      // Load models with error handling
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models').catch(err => {
          console.warn('Error loading tinyFaceDetector model:', err);
          return null;
        }),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models').catch(err => {
          console.warn('Error loading faceLandmark68Net model:', err);
          return null;
        }),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models').catch(err => {
          console.warn('Error loading faceRecognitionNet model:', err);
          return null;
        })
      ]);
      
      console.log('Face detection models loaded successfully');
      startFaceDetection();
    } catch (error) {
      console.error('Error loading face detection models:', error);
      // If face detection fails, we'll still allow the game to continue
      setIsFaceDetected(true); // Allow answers without face detection
    }
  }, []);

  const startFaceDetection = () => {
    if (!localVideoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const displaySize = {
      width: localVideoRef.current.width,
      height: localVideoRef.current.height
    };

    faceapi.matchDimensions(canvas, displaySize);

    const detectFaces = async () => {
      try {
        const detections = await faceapi.detectAllFaces(
          localVideoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        setIsFaceDetected(detections.length > 0);
      } catch (error) {
        console.error('Error during face detection:', error);
        // If face detection fails, allow answers
        setIsFaceDetected(true);
      }
    };

    // Run face detection every 100ms
    setInterval(detectFaces, 100);
  };

  const handleAnswerClick = (index) => {
    if (selectedAnswer !== null || !game?.currentQuestion || !isFaceDetected) return;
    setSelectedAnswer(index);
    onAnswer(index === game.currentQuestion.correctAnswer);
  };

  useEffect(() => {
    initializeVideo();
    initializeFaceDetection();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initializeVideo, initializeFaceDetection, localStream]);

  useEffect(() => {
    if (game?.currentQuestion) {
      setTimeLeft(10);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            onAnswer(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [game?.currentQuestion, onAnswer]);

  if (isGameEnded) {
    return (
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom>
            Game Over!
          </Typography>
          <Typography variant="h5" color="primary">
            Winner: {game?.winner?.name || 'No winner'}
          </Typography>
          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Final Scores:
            </Typography>
            {game?.finalScores?.map((p) => (
              <Typography key={p.id} variant="body1">
                {p.name}: {p.score} points
              </Typography>
            ))}
          </Box>
        </Paper>
      </Container>
    );
  }

  if (!game || !game.currentQuestion || isLoading) {
    return (
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography variant="h5" component="h2">
            Loading game...
          </Typography>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative' }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', borderRadius: '8px' }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '8px'
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative' }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                srcObject={remoteStream}
                style={{ width: '100%', borderRadius: '8px' }}
              />
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={(timeLeft / 10) * 100}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 1 }}>
            Time left: {timeLeft}s
          </Typography>
        </Box>

        <Typography variant="h6" color="text.secondary">
          Question {game.questionNumber} of {game.totalQuestions}
        </Typography>

        <Typography variant="h5" component="h2">
          {game.currentQuestion.text}
        </Typography>

        <Grid container spacing={2}>
          {game.currentQuestion.options.map((option, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Button
                fullWidth
                variant={selectedAnswer === index ? 'contained' : 'outlined'}
                onClick={() => handleAnswerClick(index)}
                disabled={selectedAnswer !== null || !isFaceDetected}
                sx={{ height: 60 }}
              >
                {option}
              </Button>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          {game.players.map((p) => (
            <Typography key={p.id} variant="h6">
              {p.name}: {p.score}
            </Typography>
          ))}
        </Box>

        {!isFaceDetected && (
          <Typography color="error" align="center">
            Please make sure your face is visible to answer questions
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default VideoGame; 