import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: "Welcome to AI Co-Teacher",
    description: "Empowering single-teacher, multigrade classrooms in rural Pakistan.",
    icon: "🎓"
  },
  {
    id: 2,
    title: "Any Subject, Any Grade",
    description: "Snap a photo of your blackboard or textbook—whether it's Math, Science, or Urdu. The AI instantly detects the subject and generates differentiated worksheets.",
    icon: "📸"
  },
  {
    id: 3,
    title: "Offline First",
    description: "No internet? No problem. Every generated worksheet is automatically saved to your device. View and export them as PDFs anytime, entirely offline.",
    icon: "📶"
  }
];

const OnboardingScreen = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const currentSlide = onboardingData[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.slide}>
        <Text style={styles.icon}>{currentSlide.icon}</Text>
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View 
              key={index} 
              style={[styles.dot, currentIndex === index ? styles.activeDot : null]} 
            />
          ))}
        </View>
        <Button 
          title={currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"} 
          onPress={handleNext} 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    lineHeight: 28,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#007BFF',
    width: 20,
  }
});

export default OnboardingScreen;
