import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Platform, Animated, ImageBackground } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import WorksheetCard from '../components/WorksheetCard';
import { extractLesson, generateWorksheetsFromInfo } from '../services/api';
import { saveLesson } from '../services/db';

const bgImage = require('../../assets/blue_school_bg.png');

const MainScreen = ({ onHistoryPress, onLogout }) => {
  const [image, setImage] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [worksheets, setWorksheets] = useState([]);
  const [lessonInfo, setLessonInfo] = useState(null);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('English');
  const [showCamera, setShowCamera] = useState(false);

  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [isRecording]);

  const pickImage = async () => {
    try {
      resetState();
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setImage(selectedAsset.uri);
        handleProcess(selectedAsset.base64);
      }
    } catch (err) {
      setError('Failed to pick image.');
    }
  };

  const startCamera = async () => {
    if (!permission) return;
    if (!permission.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert("Permission Required", "Camera permission is required to take photos.");
        return;
      }
    }
    resetState();
    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
        setShowCamera(false);
        setImage(photo.uri);
        handleProcess(photo.base64);
      } catch (err) {
        setError('Failed to take photo.');
        setShowCamera(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      resetState();
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
      } else {
        Alert.alert("Permission Required", "Microphone permission is required to record audio.");
      }
    } catch (err) {
      setError('Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      let base64Audio;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        base64Audio = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      }
      
      handleProcess(null, base64Audio);
    } catch (err) {
      setError('Failed to stop recording.');
    }
  };

  const resetState = () => {
    setError('');
    setWorksheets([]);
    setLessonInfo(null);
    setImage(null);
  };

  const handleProcess = async (base64String, base64Audio = null) => {
    setError('');
    setIsExtracting(true);
    let extractedInfo = null;
    try {
      extractedInfo = await extractLesson(base64String, base64Audio);
      setLessonInfo(extractedInfo);
    } catch (err) {
      setError(err.message || 'An error occurred during extraction.');
      setIsExtracting(false);
      return;
    }
    setIsExtracting(false);

    setIsGenerating(true);
    try {
      const generatedWorksheets = await generateWorksheetsFromInfo(extractedInfo, language);
      setWorksheets(generatedWorksheets);

      await saveLesson(
        image, 
        extractedInfo.subject, 
        extractedInfo.topic, 
        extractedInfo.key_concepts, 
        generatedWorksheets, 
        language
      );
    } catch (err) {
      setError(err.message || 'An error occurred while generating worksheets.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef} facing="back">
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCamera(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  const isIdle = !isExtracting && !isGenerating && !lessonInfo && worksheets.length === 0 && !image;

  return (
    <ImageBackground source={bgImage} style={styles.bgImage} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.appContainer}>
          
          <View style={styles.navBar}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.navTitle}>EduNova </Text>
                <MaterialCommunityIcons name="rocket" size={24} color="#ff007f" />
              </View>
              <Text style={styles.subtitle}>Empowering educators anywhere, in any language.</Text>
            </View>
            <View style={styles.navActionRow}>
              <TouchableOpacity style={styles.navBtn} onPress={onHistoryPress}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="folder" size={12} color="#1e293b" style={{ marginRight: 4 }} />
                  <Text style={styles.navBtnText}>History</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navBtn, styles.logoutBtn]} onPress={onLogout}>
                <Text style={[styles.navBtnText, styles.logoutBtnText]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Feather name="globe" size={16} color="#0ea5e9" style={{ marginRight: 6 }} />
              <Text style={[styles.label, { marginBottom: 0 }]}>Output Language</Text>
            </View>
            <View style={styles.langButtons}>
              {['English', 'Urdu', 'Sindhi', 'Pashto', 'Arabic'].map(lang => (
                <TouchableOpacity 
                  key={lang}
                  style={[styles.langBtn, language === lang && styles.langBtnActive]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text style={[styles.langBtnText, language === lang && styles.langBtnTextActive]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Generate Lesson</Text>
          <View style={styles.actionGrid}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
              <TouchableOpacity 
                style={[styles.primaryBtn, isRecording && styles.recordingBtn]} 
                onPress={isRecording ? stopRecording : startRecording}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name={isRecording ? "square" : "mic"} size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>
                    {isRecording ? "Stop Recording" : "Speak Lesson"}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <View style={{flexDirection: 'row', width: '100%', gap: 10}}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={startCamera}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="camera" size={14} color="#0ea5e9" style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryBtnText}>Snap Textbook</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="image" size={14} color="#0ea5e9" style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryBtnText}>Upload Image</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {isIdle && (
            <View style={styles.tipsCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Feather name="info" size={16} color="#0284c7" style={{ marginRight: 6 }} />
                <Text style={[styles.tipsTitle, { marginBottom: 0 }]}>Quick Tips</Text>
              </View>
              <Text style={styles.tipsText}>• Speak naturally into the mic to explain a concept.</Text>
              <Text style={styles.tipsText}>• Snap a photo of a textbook page or notes.</Text>
              <Text style={styles.tipsText}>• We automatically extract the topic and generate 3 custom worksheets for you!</Text>
            </View>
          )}

          {image && (
            <View style={styles.imageCard}>
              <Image source={{ uri: image }} style={styles.image} />
            </View>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="alert-circle" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </View>
          ) : null}

          {isExtracting && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#ff007f" />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
                <Text style={[styles.loadingTitle, { marginTop: 0 }]}>Analyzing Subject... </Text>
                <Feather name="search" size={18} color="#1e293b" />
              </View>
            </View>
          )}

          {isGenerating && (
            <View style={styles.worksheetsContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <Feather name="zap" size={20} color="#ff007f" style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Designing Worksheets...</Text>
              </View>
              {[1, 2, 3].map((key) => (
                <View key={key} style={[styles.worksheetWrapper, { padding: 20, minHeight: 150 }]}>
                  <View style={{ width: '40%', height: 24, backgroundColor: '#e2e8f0', borderRadius: 12, marginBottom: 15 }} />
                  <View style={{ width: '100%', height: 16, backgroundColor: '#f1f5f9', borderRadius: 8, marginBottom: 10 }} />
                  <View style={{ width: '90%', height: 16, backgroundColor: '#f1f5f9', borderRadius: 8, marginBottom: 10 }} />
                  <View style={{ width: '95%', height: 16, backgroundColor: '#f1f5f9', borderRadius: 8 }} />
                </View>
              ))}
            </View>
          )}

          {!isExtracting && lessonInfo && (
            <View style={styles.lessonInfoCard}>
              <View style={styles.badgeRow}>
                <View style={[styles.badgeTopic, { flexDirection: 'row', alignItems: 'center' }]}>
                  <Feather name="book-open" size={12} color="#ff007f" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#ff007f', fontFamily: 'Poppins_900Black', fontSize: 12 }}>{lessonInfo.subject}</Text>
                </View>
                <View style={[styles.badgeOutline, { flexDirection: 'row', alignItems: 'center' }]}>
                  <Feather name="globe" size={12} color="#0ea5e9" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#0ea5e9', fontFamily: 'Poppins_900Black', fontSize: 12 }}>{lessonInfo.source_language || 'Detected'}</Text>
                </View>
              </View>
              <Text style={styles.lessonTopic}>{lessonInfo.topic}</Text>
              <Text style={styles.lessonConcepts}>Concepts: {lessonInfo.key_concepts?.join(', ')}</Text>
            </View>
          )}

          {!isExtracting && !isGenerating && worksheets.length > 0 && (
            <View style={styles.worksheetsContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <Feather name="zap" size={20} color="#ff007f" style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Generated Worksheets</Text>
              </View>
              {worksheets.map((ws, index) => (
                <View key={index} style={styles.worksheetWrapper}>
                  <WorksheetCard worksheet={ws} language={language} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#d6e9f7',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: 'rgba(214, 233, 247, 0.4)', 
    alignItems: 'center',
  },
  appContainer: {
    width: '100%',
    maxWidth: 550,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  navTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_900Black',
    color: '#ff007f',
  },
  subtitle: {
    fontSize: 12,
    color: '#0ea5e9',
    fontFamily: 'Poppins_700Bold',
  },
  navActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navBtn: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  navBtnText: {
    color: '#1e293b',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
  logoutBtn: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
  },
  logoutBtnText: {
    color: '#64748b',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Poppins_900Black',
    color: '#0ea5e9',
    marginBottom: 12,
  },
  langButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  langBtnActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderColor: '#0ea5e9',
  },
  langBtnText: {
    color: '#64748b',
    fontFamily: 'Poppins_700Bold',
  },
  langBtnTextActive: {
    color: '#0ea5e9',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_900Black',
    color: '#ff007f',
    marginBottom: 15,
  },
  actionGrid: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#ff007f',
    width: '100%',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#ff007f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  recordingBtn: {
    backgroundColor: '#e53e3e',
    shadowColor: '#e53e3e',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 1,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0ea5e9',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  secondaryBtnText: {
    color: '#0ea5e9',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  tipsCard: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 25,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_900Black',
    color: '#0284c7',
    marginBottom: 10,
  },
  tipsText: {
    color: '#0369a1',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  imageCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
    borderRadius: 12,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fca5a5',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontFamily: 'Poppins_700Bold',
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  loadingTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1e293b',
    marginTop: 15,
  },
  lessonInfoCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  badgeTopic: {
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeOutline: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lessonTopic: {
    fontSize: 22,
    fontFamily: 'Poppins_900Black',
    color: '#1e293b',
    marginBottom: 5,
  },
  lessonConcepts: {
    color: '#64748b',
    lineHeight: 20,
  },
  worksheetsContainer: {
    width: '100%',
  },
  worksheetWrapper: {
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 5, 
    marginBottom: 15, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  cancelBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 20,
  },
  cancelBtnText: {
    color: 'white',
    fontFamily: 'Poppins_700Bold',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  }
});

export default MainScreen;
