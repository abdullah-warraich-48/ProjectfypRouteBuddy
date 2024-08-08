import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useContext, useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import { UserContext } from '../context/UserContext';
import { firebase, storage } from '../firebase/firebaseConfig'; // Adjust this import based on your project structure

const RouteInfo = () => {
  const { currentUser } = useContext(UserContext);
  const route = useRoute();
  const navigation = useNavigation();
  const {
    startCoords,
    endCoords,
    distance,
    duration,
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
  const [subStops, setSubStops] = useState([]);
  const [departureTime, setDepartureTime] = useState(new Date());
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [price, setPrice] = useState('');
  const [uploading, setUploading] = useState(false);

  const [startPointError, setStartPointError] = useState('');
  const [destinationError, setDestinationError] = useState('');
  const [subStopsError, setSubStopsError] = useState('');
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
      subStops,
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
      } else if (locationType === 'subStop') {
        setSubStops((prevSubStops) => [
          ...prevSubStops,
          `Lat: ${selectedLocation.latitude}, Lon: ${selectedLocation.longitude}`,
        ]);
      }
    }
    setMapVisible(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Route Information</Text>
      
      {/* Display route info */}
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
      
      {/* Navigation icons */}
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
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('vehicleInfo')}>
            <View style={styles.circle}>
              <Icon name="car" size={30} color="#fff" />
            </View>
            <Text style={styles.iconText}>Vehicle</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('routeInfo')}>
            <View style={styles.circle}>
              <Icon name="map" size={30} color="#fff" />
            </View>
            <Text style={styles.iconText}>Route</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Starting Point"
            value={startPoint}
            onChangeText={setStartPoint}
          />
          {startPointError && <Text style={styles.errorText}>{startPointError}</Text>}
          <TouchableOpacity onPress={() => handleSelectLocation('start')}>
            <Text style={styles.selectButton}>Select on Map</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Destination"
            value={destination}
            onChangeText={setDestination}
          />
          {destinationError && <Text style={styles.errorText}>{destinationError}</Text>}
          <TouchableOpacity onPress={() => handleSelectLocation('destination')}>
            <Text style={styles.selectButton}>Select on Map</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Price"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          {priceError && <Text style={styles.errorText}>{priceError}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Departure Time:</Text>
          <TouchableOpacity onPress={() => setShowDeparturePicker(true)}>
            <Text style={styles.dateButton}>{departureTime.toLocaleTimeString()}</Text>
          </TouchableOpacity>
          {showDeparturePicker && (
            <DateTimePicker
              mode="time"
              value={departureTime}
              onChange={handleDepartureTimeChange}
              display="default"
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Arrival Time:</Text>
          <TouchableOpacity onPress={() => setShowArrivalPicker(true)}>
            <Text style={styles.dateButton}>{arrivalTime.toLocaleTimeString()}</Text>
          </TouchableOpacity>
          {showArrivalPicker && (
            <DateTimePicker
              mode="time"
              value={arrivalTime}
              onChange={handleArrivalTimeChange}
              display="default"
            />
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveData}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Map Modal */}
      <Modal visible={mapVisible} transparent={true} animationType="slide">
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: startCoords ? startCoords.latitude : 37.78825,
              longitude: startCoords ? startCoords.longitude : -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleMapPress}
          >
            {selectedLocation && (
              <Marker coordinate={selectedLocation} />
            )}
          </MapView>
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapButton} onPress={handleConfirmLocation}>
              <Text style={styles.mapButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapButton} onPress={() => setMapVisible(false)}>
              <Text style={styles.mapButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f4f4f4',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoContainer: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
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
    marginVertical: 16,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    padding: 8,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    marginTop: 4,
    fontSize: 12,
    color: '#007bff',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  dateButton: {
    fontSize: 16,
    color: '#007bff',
  },
  saveButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: '80%',
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
  mapButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
  selectButton: {
    color: '#007bff',
    marginTop: 8,
  },
});

export default RouteInfo;
