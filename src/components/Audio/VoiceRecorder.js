import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Trash2, Save, Download } from 'lucide-react';

const VoiceRecorder = ({ onSave, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setAudioBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setIsPaused(false);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Fehler beim Zugriff auf das Mikrofon. Bitte Berechtigung erteilen.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setAudioURL(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const saveRecording = () => {
    if (audioBlob && onSave) {
      const audioData = {
        blob: audioBlob,
        url: audioURL,
        duration: recordingTime,
        timestamp: new Date().toISOString(),
        type: 'voice_note'
      };
      onSave(audioData);
    }
  };

  const downloadRecording = () => {
    if (audioURL) {
      const link = document.createElement('a');
      link.href = audioURL;
      link.download = `voice_note_${new Date().toISOString()}.webm`;
      link.click();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Sprachnotiz aufnehmen</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MicOff className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Recording Timer */}
        <div className="text-center mb-6">
          <div className="text-3xl font-mono text-gray-900 mb-2">
            {formatTime(recordingTime)}
          </div>
          <div className="text-sm text-gray-500">
            {isRecording ? (isPaused ? 'Pausiert' : 'Aufnahme läuft...') : 'Bereit zur Aufnahme'}
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          {!isRecording && !audioURL && (
            <button
              onClick={startRecording}
              className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 transition-colors"
            >
              <Mic className="w-6 h-6" />
            </button>
          )}
          
          {isRecording && !isPaused && (
            <>
              <button
                onClick={pauseRecording}
                className="bg-yellow-600 text-white p-4 rounded-full hover:bg-yellow-700 transition-colors"
              >
                <Pause className="w-6 h-6" />
              </button>
              <button
                onClick={stopRecording}
                className="bg-gray-600 text-white p-4 rounded-full hover:bg-gray-700 transition-colors"
              >
                <MicOff className="w-6 h-6" />
              </button>
            </>
          )}
          
          {isRecording && isPaused && (
            <>
              <button
                onClick={resumeRecording}
                className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 transition-colors"
              >
                <Mic className="w-6 h-6" />
              </button>
              <button
                onClick={stopRecording}
                className="bg-gray-600 text-white p-4 rounded-full hover:bg-gray-700 transition-colors"
              >
                <MicOff className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Playback Controls */}
        {audioURL && (
          <div className="space-y-4">
            <audio
              ref={audioRef}
              src={audioURL}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full"
              controls
            />
            
            <div className="flex justify-center space-x-2">
              <button
                onClick={isPlaying ? pauseAudio : playAudio}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause' : 'Abspielen'}</span>
              </button>
              
              <button
                onClick={deleteRecording}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Löschen</span>
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={saveRecording}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Speichern</span>
              </button>
              
              <button
                onClick={downloadRecording}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && !isPaused && (
          <div className="flex items-center justify-center mt-4">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></div>
            <span className="text-red-600 text-sm font-medium">REC</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;