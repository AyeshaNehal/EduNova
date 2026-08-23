import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ImageBackground } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

const bgImage = require('../../assets/blue_school_bg.png');

const AdminScreen = ({ onLogout }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();

    const channel = supabase
      .channel('public:lessons')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lessons' }, (payload) => {
        setLessons((current) => [payload.new, ...current]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchLessons() {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Stats
  const totalLessons = lessons.length;
  const uniqueSubjects = [...new Set(lessons.map(l => l.subject))].length;
  const recentActivity = lessons.filter(l => {
    const today = new Date();
    const lessonDate = new Date(l.created_at);
    return today.toDateString() === lessonDate.toDateString();
  }).length;

  const subjectCounts = {};
  lessons.forEach(l => {
    const sub = l.subject || 'Unknown';
    subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
  });
  const topSubjects = Object.entries(subjectCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const maxCount = topSubjects.length > 0 ? Math.max(...topSubjects.map(s => s.count)) : 1;

  const renderLessonItem = ({ item }) => (
    <View style={styles.feedItem}>
      <View style={styles.feedHeader}>
        <View style={[styles.badgeSubject, { flexDirection: 'row', alignItems: 'center' }]}>
          <Feather name="book-open" size={12} color="#0ea5e9" style={{ marginRight: 4 }} />
          <Text style={{ color: '#0ea5e9', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>{item.subject || 'Unknown'}</Text>
        </View>
        <View style={[styles.badgeLang, { flexDirection: 'row', alignItems: 'center' }]}>
          <Feather name="globe" size={12} color="#ff007f" style={{ marginRight: 4 }} />
          <Text style={{ color: '#ff007f', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>{item.language}</Text>
        </View>
      </View>
      <Text style={styles.feedTopic}>{item.topic}</Text>
      <Text style={styles.feedConcepts}>
        Concepts: {Array.isArray(item.key_concepts) ? item.key_concepts.join(', ') : 'N/A'}
      </Text>
      <Text style={styles.feedTime}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <ImageBackground source={bgImage} style={styles.bgImage} resizeMode="cover">
      <View style={styles.overlay}>
        <View style={styles.appContainer}>
          <View style={styles.navBar}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.navTitle}>Principal's Desk </Text>
                <Feather name="award" size={24} color="#0ea5e9" />
              </View>
              <Text style={{ fontSize: 12, color: '#ff007f', fontFamily: 'Poppins_700Bold' }}>Empowering educators anywhere, in any language.</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Worksheets</Text>
              <Text style={styles.statValue}>{totalLessons * 3}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Subjects Taught</Text>
              <Text style={styles.statValue}>{uniqueSubjects}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Generated Today</Text>
              <Text style={styles.statValue}>{recentActivity}</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Feather name="bar-chart-2" size={18} color="#1e293b" style={{ marginRight: 6 }} />
              <Text style={[styles.chartTitle, { marginBottom: 0 }]}>Top Subjects</Text>
            </View>
            {topSubjects.length < 3 ? (
              <View style={{padding: 20, alignItems: 'center'}}>
                <Text style={styles.emptyText}>Not enough data to chart.</Text>
                <Text style={{color: '#94a3b8', fontSize: 12, marginTop: 5}}>Generate at least 3 subjects.</Text>
              </View>
            ) : (
              <View style={styles.chartArea}>
                {topSubjects.map((sub, index) => {
                  const barWidth = Math.max((sub.count / maxCount) * 100, 5);
                  return (
                    <View key={index} style={styles.barRow}>
                      <Text style={styles.barLabel} numberOfLines={1}>{sub.name}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${barWidth}%` }]} />
                      </View>
                      <Text style={styles.barValue}>{sub.count}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.feedContainer}>
            <View style={styles.feedTitleContainer}>
              <Feather name="activity" size={18} color="#1e293b" style={{ marginRight: 6 }} />
              <Text style={styles.feedTitleText}>Live Lesson Feed</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color="#ff007f" style={{ marginTop: 20 }} />
            ) : lessons.length === 0 ? (
              <Text style={styles.emptyText}>No lessons generated yet.</Text>
            ) : (
              <FlatList
                data={lessons}
                keyExtractor={item => item.id.toString()}
                renderItem={renderLessonItem}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </View>
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
    backgroundColor: 'rgba(214, 233, 247, 0.85)', // Much more opaque for Admin screen to mute the busy background
    alignItems: 'center',
    padding: 20,
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
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
  },
  navTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_900Black',
    color: '#0ea5e9',
  },
  logoutBtn: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logoutBtnText: {
    color: '#64748b',
    fontFamily: 'Poppins_700Bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Poppins_900Black',
    color: '#ff007f',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 5,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_900Black',
    color: '#1e293b',
    marginBottom: 15,
  },
  chartArea: {
    marginTop: 5,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 80,
    fontSize: 12,
    color: '#64748b',
    marginRight: 10,
    fontFamily: 'Poppins_700Bold',
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 6,
  },
  barValue: {
    width: 30,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: 'Poppins_900Black',
    color: '#0ea5e9',
    marginLeft: 10,
  },
  feedContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  feedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  feedTitleText: {
    fontSize: 18,
    fontFamily: 'Poppins_900Black',
    color: '#1e293b',
  },
  listContent: {
    padding: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 20,
    fontFamily: 'Poppins_700Bold',
  },
  feedItem: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  feedHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badgeSubject: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeLang: {
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  feedTopic: {
    fontSize: 18,
    fontFamily: 'Poppins_900Black',
    color: '#1e293b',
    marginBottom: 5,
  },
  feedConcepts: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
  },
  feedTime: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
  },
});

export default AdminScreen;
