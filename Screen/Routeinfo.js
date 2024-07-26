import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useContext, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { UserContext } from '../context/UserContext';
import { firebase } from '../firebase/firebaseConfig'; // Adjust this import based on your project structure

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
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [price, setPrice] = useState('');
  const [uploading, setUploading] = useState(false);

  const [startPointError, setStartPointError] = useState('');
  const [destinationError, setDestinationError] = useState('');
  const [departureTimeError, setDepartureTimeError] = useState('');
  const [arrivalTimeError, setArrivalTimeError] = useState('');
  const [priceError, setPriceError] = useState('');

  const [isDeparturePickerVisible, setDeparturePickerVisibility] = useState(false);
  const [isArrivalPickerVisible, setArrivalPickerVisibility] = useState(false);

  const handleDepartureConfirm = (date) => {
    setDepartureTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setDeparturePickerVisibility(false);
  };

  const handleArrivalConfirm = (date) => {
    setArrivalTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setArrivalPickerVisibility(false);
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

    if (!departureTime.trim()) {
      setDepartureTimeError('Departure time is required');
      isValid = false;
    } else {
      setDepartureTimeError('');
    }

    if (!arrivalTime.trim()) {
      setArrivalTimeError('Arrival time is required');
      isValid = false;
    } else {
      setArrivalTimeError('');
    }

    if (!price.trim() || isNaN(price)) {
      setPriceError('Price is required and must be a number');
      isValid = false;
    } else {
      setPriceError('');
    }

    if (!isValid) return;

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
      departureTime,
      arrivalTime,
      price,
      vehicleImageUri,
      licenseImageUri,
    };

    try {
      const database = firebase.database();
      const driverRef = await database.ref('driverRef').push(routeInfo);
      console.log('Route info saved successfully');
      navigation.navigate('DriverHome', { screen: 'RideRequest' });
    } catch (error) {
      console.error('Error saving route info:', error.message);
      console.error('Error details:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('PersonalInfo')}>
            <View style={styles.circle}>
              <Icon name="user" size={30} color="#fff" />
            </View>
            <Text style={styles.iconText}>Personal</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('VehicleInfo')}>
            <View style={styles.circle}>
              <Icon name="car" size={30} color="#fff" />
            </View>
            <Text style={styles.iconText}>Vehicle</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Routeinfo')}>
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
          <TouchableOpacity onPress={() => setDeparturePickerVisibility(true)}>
            <TextInput
              style={[styles.input, departureTimeError ? styles.inputError : null]}
              placeholder="Select departure time"
              value={departureTime}
              editable={false}
            />
          </TouchableOpacity>
          {departureTimeError ? <Text style={styles.errorText}>{departureTimeError}</Text> : null}
          <DateTimePickerModal
            isVisible={isDeparturePickerVisible}
            mode="time"
            onConfirm={handleDepartureConfirm}
            onCancel={() => setDeparturePickerVisibility(false)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Arrival Time</Text>
          <TouchableOpacity onPress={() => setArrivalPickerVisibility(true)}>
            <TextInput
              style={[styles.input, arrivalTimeError ? styles.inputError : null]}
              placeholder="Select arrival time"
              value={arrivalTime}
              editable={false}
            />
          </TouchableOpacity>
          {arrivalTimeError ? <Text style={styles.errorText}>{arrivalTimeError}</Text> : null}
          <DateTimePickerModal
            isVisible={isArrivalPickerVisible}
            mode="time"
            onConfirm={handleArrivalConfirm}
            onCancel={() => setArrivalPickerVisibility(false)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Price (in PKR)</Text>
          <TextInput
            style={[styles.input, priceError ? styles.inputError : null]}
            placeholder="Enter price"
            value={price}
            onChangeText={text => setPrice(text)}
            keyboardType="numeric"
          />
          {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSaveData} disabled={uploading}>
          <Text style={styles.buttonText}>{uploading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.button1} onPress={() => navigation.navigate('DriverPortfolio')}>
        <Text style={styles.buttonText}>Add Route</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    backgroundColor: '#32a4a8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#f2f2f2',
  },
  inputError: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#32a4a8',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button1: {
    backgroundColor: '#32a4a8',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
});

export default Routeinfo;
