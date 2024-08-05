import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useContext, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { UserContext } from '../context/UserContext';
import { firebase, storage } from '../firebase/firebaseConfig'; // Adjust this import based on your project structure

const Routeinfo = () => {
  const { currentUser } = useContext(UserContext);
  const route = useRoute();
  const navigation = useNavigation();

  const {
    firstName,
    lastName,
    phoneNumber,
    address,
    age,
    vehicleType = '',
    seats,
    model,
    vehicleImageUri = '',
    licenseImageUri = ''
  } = route.params || {};

  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState(new Date());
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [price, setPrice] = useState('');
  const [uploading, setUploading] = useState(false);

  const [startPointError, setStartPointError] = useState('');
  const [destinationError, setDestinationError] = useState('');
  const [departureTimeError, setDepartureTimeError] = useState('');
  const [arrivalTimeError, setArrivalTimeError] = useState('');
  const [priceError, setPriceError] = useState('');

  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `uploads/${Date.now()}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      setUploading(false);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploading(false);
      throw error;
    }
  };

  const handleSaveData = async () => {
    let isValid = true;

    if (!startPoint.trim()) {
      setStartPointError('Starting Point is required');
      isValid = false;
    } else {
      setStartPointError('');
    }

    if (!destination.trim()) {
      setDestinationError('Destination is required');
      isValid = false;
    } else {
      setDestinationError('');
    }

    if (!departureTime) {
      setDepartureTimeError('Departure time is required');
      isValid = false;
    } else {
      setDepartureTimeError('');
    }

    if (!arrivalTime) {
      setArrivalTimeError('Arrival time is required');
      isValid = false;
    } else {
      setArrivalTimeError('');
    }

    if (!price.trim()) {
      setPriceError('Price is required');
      isValid = false;
    } else {
      setPriceError('');
    }

    if (!isValid) return;

    let vehicleImageURL = vehicleImageUri;
    let licenseImageURL = licenseImageUri;

    if (vehicleImageUri) {
      try {
        vehicleImageURL = await uploadImage(vehicleImageUri);
      } catch (error) {
        console.error('Error uploading vehicle image:', error.message);
      }
    }

    if (licenseImageUri) {
      try {
        licenseImageURL = await uploadImage(licenseImageUri);
      } catch (error) {
        console.error('Error uploading license image:', error.message);
      }
    }

    const routeInfo = {
      email: currentUser.email,
      firstName,
      lastName,
      phoneNumber,
      address,
      age,
      vehicleType,
      seats,
      model,
      startPoint,
      destination,
      departureTime: departureTime.toISOString(),
      arrivalTime: arrivalTime.toISOString(),
      price,
      vehicleImageURL,
      licenseImageURL,
    };

    try {
      const database = firebase.database();
      const driverRef = await database.ref('driverRef').push(routeInfo);
      console.log('Route info saved successfully');
      navigation.navigate('RideRequest');
    } catch (error) {
      console.error('Error saving route info:', error.message);
      console.error('Error details:', error);
    }
  };

  const handleDepartureTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || departureTime;
    setShowDeparturePicker(Platform.OS === 'ios');
    setDepartureTime(currentTime);
  };

  const handleArrivalTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || arrivalTime;
    setShowArrivalPicker(Platform.OS === 'ios');
    setArrivalTime(currentTime);
  };

  useEffect(() => {
    if (!departureTime) setDepartureTime(new Date());
    if (!arrivalTime) setArrivalTime(new Date());
  }, [departureTime, arrivalTime]);

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('personalInfo')}>
            <View style={styles.circle}>
              <Icon name="user" size={30} color="#fff" />
            </View>
            <Text style={styles.iconText}>Personal</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('vehicleinfo')}>
            <View style={styles.circle}>
              <Icon name="car" size={30} color="#fff" />
            </View>
            <Text style={styles.iconText}>Vehicle</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <View style={styles.circle}>
              <Icon name="road" size={30} color="#fff" />
            </View>
            <Text style={styles.iconText}>Route</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Starting Point</Text>
          <TextInput
            style={[styles.input, startPointError ? styles.inputError : null]}
            placeholder="Enter starting point"
            value={startPoint}
            onChangeText={text => setStartPoint(text)}
          />
          {startPointError ? <Text style={styles.errorText}>{startPointError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Destination</Text>
          <TextInput
            style={[styles.input, destinationError ? styles.inputError : null]}
            placeholder="Enter destination"
            value={destination}
            onChangeText={text => setDestination(text)}
          />
          {destinationError ? <Text style={styles.errorText}>{destinationError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Departure Time</Text>
          <TouchableOpacity
            style={[styles.input, departureTimeError ? styles.inputError : null]}
            onPress={() => setShowDeparturePicker(true)}
          >
            <Text>{departureTime ? departureTime.toLocaleTimeString() : 'Select Time'}</Text>
          </TouchableOpacity>
          {showDeparturePicker && (
            <DateTimePicker
              value={departureTime}
              mode="time"
              display="default"
              onChange={handleDepartureTimeChange}
            />
          )}
          {departureTimeError ? <Text style={styles.errorText}>{departureTimeError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Arrival Time</Text>
          <TouchableOpacity
            style={[styles.input, arrivalTimeError ? styles.inputError : null]}
            onPress={() => setShowArrivalPicker(true)}
          >
            <Text>{arrivalTime ? arrivalTime.toLocaleTimeString() : 'Select Time'}</Text>
          </TouchableOpacity>
          {showArrivalPicker && (
            <DateTimePicker
              value={arrivalTime}
              mode="time"
              display="default"
              onChange={handleArrivalTimeChange}
            />
          )}
          {arrivalTimeError ? <Text style={styles.errorText}>{arrivalTimeError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Price (in PKR)</Text>
          <TextInput
            style={[styles.input, priceError ? styles.inputError : null]}
            placeholder="Enter price"
            value={price}
            onChangeText={text => setPrice(text)}
          />
          {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveData}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 12,
  },
  form: {
    paddingBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default Routeinfo;
