import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useContext, useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome';
import { UserContext } from '../context/UserContext';
import { firebase, storage } from '../firebase/firebaseConfig';

const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

const RouteInfo = () => {
  const { currentUser } = useContext(UserContext);
  const route = useRoute();
  const navigation = useNavigation();
  const { startCoords, endCoords, distance, duration, firstName, lastName, phoneNumber, address, age, vehicleType = '', seats, model, vehicleImageUri = '', licenseImageUri = '' } = route.params || {};

  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [subStops, setSubStops] = useState([]); // State for substops
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
      subStops, // Add substops to the route info
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
      } else if (locationType === 'substop') {
        setSubStops([...subStops, { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }]);
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
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('RouteInfo')}>
            <View style={styles.circle}>
              <Icon name="road" size={30} color="#fff" />
            </View>
            <Text style={styles.iconText}>Route</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={() => handleSelectLocation('start')}>
          <TextInput
            style={[styles.input, startPointError ? styles.inputError : null]}
            placeholder="Select Starting Point"
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
            placeholder="Select Destination"
            value={destination}
            editable={false}
          />
        </TouchableOpacity>
        {destinationError ? <Text style={styles.errorText}>{destinationError}</Text> : null}
      </View>
      
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={() => handleSelectLocation('substop')}>
          <TextInput
            style={[styles.input, subStops.length === 0 ? styles.inputError : null]}
            placeholder="Add Substops"
            value={subStops.map(substop => `Lat: ${substop.latitude}, Lon: ${substop.longitude}`).join('\n')}
            editable={false}
            multiline={true}
          />
        </TouchableOpacity>
        {subStops.length === 0 ? <Text style={styles.errorText}>Please add at least one substop</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={() => setShowDeparturePicker(true)}>
          <TextInput
            style={[styles.input, departureTimeError ? styles.inputError : null]}
            placeholder="Select Departure Time"
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
            placeholder="Select Arrival Time"
            value={arrivalTime.toLocaleString()}
            editable={false}
          />
        </TouchableOpacity>
        {arrivalTimeError ? <Text style={styles.errorText}>{arrivalTimeError}</Text> : null}
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, priceError ? styles.inputError : null]}
          placeholder="Enter Price"
          keyboardType="numeric"
          value={price}
          onChangeText={(text) => setPrice(text)}
        />
        {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
      </View>
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveData}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
      
      <Modal visible={mapVisible} animationType="slide">
        <View style={styles.mapContainer}>
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
            {selectedLocation && locationType !== 'substop' && (
              <Marker coordinate={selectedLocation} />
            )}
            {subStops.map((substop, index) => (
              <Marker key={index} coordinate={substop} pinColor="green" />
            ))}
          </MapView>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {showDeparturePicker && (
        <DateTimePicker
          value={departureTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleDepartureTimeChange}
        />
      )}
      
      {showArrivalPicker && (
        <DateTimePicker
          value={arrivalTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleArrivalTimeChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    marginBottom: 15,
  },
  infoTitle: {
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 16,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RouteInfo;
