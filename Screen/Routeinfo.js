import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useContext, useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import { UserContext } from '../context/UserContext';
import { firebase, storage } from '../firebase/firebaseConfig'; // Adjust this import based on your project structure

const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

const RouteInfo = () => {
  const { currentUser } = useContext(UserContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { startCoords, endCoords, distance, duration, firstName, lastName, phoneNumber, address, age, vehicleType = '', seats, model, vehicleImageUri = '', licenseImageUri = '' } = route.params || {};

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

  const [mapVisible, setMapVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationType, setLocationType] = useState('start');

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
      await database.ref('driverRef').push(routeInfo);
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

  const handleSelectLocation = (type) => {
    setMapVisible(true);
    setLocationType(type);
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      if (locationType === 'start') {
        setStartPoint(`Lat: ${selectedLocation.latitude}, Lon: ${selectedLocation.longitude}`);
      } else if (locationType === 'destination') {
        setDestination(`Lat: ${selectedLocation.latitude}, Lon: ${selectedLocation.longitude}`);
      }
    }
    setMapVisible(false);
  };

  const getCoordinatesFromAddress = async (address) => {
    try {
      const response = await fetch(`${NOMINATIM_API_URL}?q=${encodeURIComponent(address)}&format=json`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      } else {
        throw new Error('No data found');
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      throw error;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Route Information</Text>
      
      {startCoords && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Start Location</Text>
          <Text style={styles.infoText}>Latitude: {startCoords.latitude}</Text>
          <Text style={styles.infoText}>Longitude: {startCoords.longitude}</Text>
        </View>
      )}
      
      {endCoords && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>End Location</Text>
          <Text style={styles.infoText}>Latitude: {endCoords.latitude}</Text>
          <Text style={styles.infoText}>Longitude: {endCoords.longitude}</Text>
        </View>
      )}
      
      {distance && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Distance</Text>
          <Text style={styles.infoText}>{distance} km</Text>
        </View>
      )}
      
      {duration && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Duration</Text>
          <Text style={styles.infoText}>{duration} hrs</Text>
        </View>
      )}
      
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
          <TouchableOpacity onPress={() => handleSelectLocation('start')}>
            <TextInput
              style={[styles.input, startPointError ? styles.inputError : null]}
              placeholder="Select starting point"
              value={startPoint}
              editable={false}
            />
          </TouchableOpacity>
          {startPointError ? <Text style={styles.errorText}>{startPointError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => handleSelectLocation('destination')}>
            <TextInput
              style={[styles.input, destinationError ? styles.inputError : null]}
              placeholder="Select destination"
              value={destination}
              editable={false}
            />
          </TouchableOpacity>
          {destinationError ? <Text style={styles.errorText}>{destinationError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => setShowDeparturePicker(true)}>
            <TextInput
              style={[styles.input, departureTimeError ? styles.inputError : null]}
              placeholder="Select departure time"
              value={departureTime.toLocaleString()}
              editable={false}
            />
          </TouchableOpacity>
          {departureTimeError ? <Text style={styles.errorText}>{departureTimeError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={() => setShowArrivalPicker(true)}>
            <TextInput
              style={[styles.input, arrivalTimeError ? styles.inputError : null]}
              placeholder="Select arrival time"
              value={arrivalTime.toLocaleString()}
              editable={false}
            />
          </TouchableOpacity>
          {arrivalTimeError ? <Text style={styles.errorText}>{arrivalTimeError}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, priceError ? styles.inputError : null]}
            placeholder="Enter price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveData}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>

      {mapVisible && (
        <Modal transparent={true} visible={mapVisible} animationType="slide">
          <View style={styles.modalContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: 32.1614, // Default to Gujranwala, Pakistan
                longitude: 74.1883,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              onPress={handleMapPress}
            >
              {selectedLocation && (
                <Marker coordinate={selectedLocation} />
              )}
            </MapView>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {showDeparturePicker && (
        <DateTimePicker
          value={departureTime}
          mode="datetime"
          display="default"
          onChange={handleDepartureTimeChange}
        />
      )}

      {showArrivalPicker && (
        <DateTimePicker
          value={arrivalTime}
          mode="datetime"
          display="default"
          onChange={handleArrivalTimeChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 16,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
  },
  circle: {
    backgroundColor: '#007bff',
    borderRadius: 25,
    padding: 10,
    marginBottom: 5,
  },
  iconText: {
    fontSize: 12,
    color: '#007bff',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '80%',
  },
  confirmButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default RouteInfo;
