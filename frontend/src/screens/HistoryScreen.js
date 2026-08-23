import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Modal, ScrollView, ImageBackground } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getSavedLessons } from '../services/db';
import WorksheetCard from '../components/WorksheetCard';

const bgImage = require('../../assets/blue_school_bg.png');

const HistoryScreen = ({ onBack }) => {
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      const savedLessons = await getSavedLessons();
      setLessons(savedLessons);
    }
    loadHistory();
  }, []);

  const renderLessonItem = ({ item }) => {
    return (
      <TouchableOpacity style={styles.lessonItem} onPress={() => setSelectedLesson(item)}>
        <View style={styles.lessonHeader}>
          <View style={[styles.badgeSubject, { flexDirection: 'row', alignItems: 'center' }]}>
            <Feather name="book-open" size={12} color="#ff007f" style={{ marginRight: 4 }} />
            <Text style={styles.badgeSubjectText}>{item.subject || 'Unknown'}</Text>
          </View>
          <Text style={styles.lessonDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.lessonTopic} numberOfLines={1}>{item.topic}</Text>
        <View style={[styles.badgeLang, { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }]}>
          <Feather name="globe" size={12} color="#0ea5e9" style={{ marginRight: 4 }} />
          <Text style={styles.badgeLangText}>{item.language}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground source={bgImage} style={styles.bgImage} resizeMode="cover">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
              <Feather name="arrow-left" size={24} color="#1e293b" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.navTitle}>Lesson History </Text>
              <Feather name="clock" size={24} color="#0ea5e9" />
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.container}>
            {lessons.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="inbox" size={32} color="#0ea5e9" />
                </View>
                <Text style={styles.emptyText}>No saved lessons yet</Text>
                <Text style={styles.emptySub}>Generate worksheets on your dashboard, and they'll automatically save here for offline access.</Text>
              </View>
            ) : (
              <FlatList
                data={lessons}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderLessonItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={true}
              />
            )}
          </View>

          <Modal visible={!!selectedLesson} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="file-text" size={20} color="#ff007f" style={{ marginRight: 8 }} />
                    <Text style={styles.modalTitle}>Worksheets</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedLesson(null)} style={styles.iconBtn}>
                    <Feather name="x" size={24} color="#1e293b" />
                  </TouchableOpacity>
                </View>
                {selectedLesson && (
                  <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={[styles.modalScroll, { paddingBottom: 60 }]}
                    showsVerticalScrollIndicator={true}
                  >
                    <View style={styles.modalLessonInfo}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                        <View style={[styles.badgeSubject, { flexDirection: 'row', alignItems: 'center' }]}>
                          <Feather name="book-open" size={12} color="#ff007f" style={{ marginRight: 4 }} />
                          <Text style={styles.badgeSubjectText}>{selectedLesson.subject}</Text>
                        </View>
                        <View style={[styles.badgeLang, { flexDirection: 'row', alignItems: 'center' }]}>
                          <Feather name="globe" size={12} color="#0ea5e9" style={{ marginRight: 4 }} />
                          <Text style={styles.badgeLangText}>{selectedLesson.language}</Text>
                        </View>
                      </View>
                      <Text style={styles.modalTopic}>{selectedLesson.topic}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 }}>
                        <Feather name="key" size={14} color="#64748b" style={{ marginRight: 6, marginTop: 4 }} />
                        <Text style={styles.modalConcepts}>{selectedLesson.key_concepts.join(', ')}</Text>
                      </View>
                    </View>
                    <View style={{ gap: 15 }}>
                      {selectedLesson.worksheets.map((ws, idx) => (
                        <WorksheetCard key={idx} worksheet={ws} language={selectedLesson.language} />
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </View>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(214, 233, 247, 0.4)', 
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  navTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_900Black',
    color: '#0ea5e9',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  listContainer: {
    paddingBottom: 20,
    gap: 15,
  },
  lessonItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeSubject: {
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeSubjectText: {
    color: '#ff007f',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
  badgeLang: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeLangText: {
    color: '#0ea5e9',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
  lessonDate: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#94a3b8',
  },
  lessonTopic: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#f8fafc',
    height: '90%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_900Black',
    color: '#1e293b',
  },
  modalScroll: {
    padding: 20,
  },
  modalLessonInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalTopic: {
    fontSize: 24,
    fontFamily: 'Poppins_900Black',
    color: '#1e293b',
  },
  modalConcepts: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    flex: 1,
  }
});

export default HistoryScreen;
