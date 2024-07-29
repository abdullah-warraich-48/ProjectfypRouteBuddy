import React, { useState, useEffect } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { firebase } from '../firebase/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

const UserInfoScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+92');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditable, setIsEditable] = useState(false); // State to control editability
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      setEmail(currentUser.email);
      fetchUserData(currentUser.uid);
    }

    return () => clearTimeout(timer);
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const userRef = firebase.database().ref(`users/${uid}`);
      const snapshot = await userRef.once('value');
      if (snapshot.exists()) {
        const data = snapshot.val();
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setAddress(data.address || '');
        setPhoneNumber(data.phoneNumber || '+92');
        setAge(data.age || '');
        setImageUrl(data.profileImageUrl || null);
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
  };

  const isValidPhoneNumber = (number) => {
    const phoneNumberRegex = /^\+92[0-9]{10}$/;
    return phoneNumberRegex.test(number);
  };

  const handleSaveUserInfo = async () => {
    if (!firstName || !lastName || !address || !isValidPhoneNumber(phoneNumber) || !age || !email) {
      alert('Please fill all fields or enter a valid phone number');
      return;
    }

    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      const uid = currentUser.uid;
      const userRef = firebase.database().ref(`users/${uid}`);
      let profileImageUrl = imageUrl;

      if (image) {
        try {
          const response = await fetch(image);
          const blob = await response.blob();
          const ref = firebase.storage().ref().child(`profileImages/${uid}`);
          await ref.put(blob);
          profileImageUrl = await ref.getDownloadURL();
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('An error occurred while uploading the image. Please try again.');
          return;
        }
      }

      userRef.update({
        firstName,
        lastName,
        address,
        phoneNumber,
        age,
        email,
        profileImageUrl,
      })
      .then(() => {
        alert('User information updated successfully');
        setIsEditable(false); // Disable editing after saving
      })
      .catch(error => {
        console.error('Error updating user information:', error);
        alert('An error occurred. Please try again.');
      });
    }
  };

  const pickImage = async () => {
    if (Constants.platform.ios) {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.container}>
        <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImage} />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No Image Selected</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => setIsEditable(!isEditable)}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            editable={isEditable}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            editable={isEditable}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            editable={isEditable}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={(text) => {
              if (text.length === 0 || !text.startsWith('+92')) {
                setPhoneNumber('+92' + text);
              } else {
                setPhoneNumber(text);
              }
            }}
            keyboardType="phone-pad"
            editable={isEditable}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            editable={isEditable}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            editable={isEditable}
          />
        </View>
        {isEditable && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveUserInfo}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  profileImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 75,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    
  },
  profileImage: {
    width: '100%',
    height: '100%',
    
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#666',
    fontStyle: 'italic',
  },
  editProfileText: {
    fontWeight: 'bold',
    marginTop: 5,
    color: '#32a4a8',
    fontSize: 16,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
  },
  saveButton: {
    backgroundColor: '#32a4a8',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserInfoScreen;
