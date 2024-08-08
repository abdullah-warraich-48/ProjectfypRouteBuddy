import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { firebase } from '../firebase/firebaseConfig';

const UserInfoScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+92');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditable, setIsEditable] = useState(false); // State to control editability
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    fetchDriverData();

    return () => clearTimeout(timer);
  }, []);

  const fetchDriverData = async () => {
    try {
      const driverRef = firebase.database().ref('driverRef');
      const snapshot = await driverRef.once('value');
      const drivers = snapshot.val();
      
      // Assuming you use email to find the driver
      const currentUserEmail = firebase.auth().currentUser.email;

      for (const key in drivers) {
        if (drivers[key].email === currentUserEmail) {
          setFirstName(drivers[key].firstName || '');
          setLastName(drivers[key].lastName || '');
          setAddress(drivers[key].address || '');
          setPhoneNumber(drivers[key].phoneNumber || '+92');
          setAge(drivers[key].age || '');
          setEmail(drivers[key].email || '');
          break;
        }
      }
    } catch (error) {
      console.error("Error fetching driver data: ", error);
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

    try {
      const driverRef = firebase.database().ref('driverRef');
      const snapshot = await driverRef.once('value');
      const drivers = snapshot.val();

      const currentUserEmail = firebase.auth().currentUser.email;

      for (const key in drivers) {
        if (drivers[key].email === currentUserEmail) {
          const driverNodeRef = driverRef.child(key);

          await driverNodeRef.update({
            firstName,
            lastName,
            address,
            phoneNumber,
            age,
            email,
          });
          
          alert('Driver information updated successfully');
          setIsEditable(false);
          break;
        }
      }
    } catch (error) {
      console.error('Error updating driver information:', error);
      alert('An error occurred. Please try again.');
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
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => setIsEditable(!isEditable)}>
            <Text style={styles.editProfileText}>Edit Data</Text>
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
  editProfileText: {
    fontWeight: 'bold',
    marginTop: 5,
    color: '#32a4a8',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default UserInfoScreen;
