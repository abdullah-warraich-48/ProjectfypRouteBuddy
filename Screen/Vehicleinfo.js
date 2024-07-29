import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/FontAwesome';

const VehicleInfo = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [model, setModel] = useState('2019');
  const [imageUri, setImageUri] = useState(null);
  const [seats, setSeats] = useState('1');
  const [color, setColor] = useState('Red');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  const handleChooseImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.cancelled) {
        setImageUri(result.assets[0].uri);
      } else {
        console.log('Image selection cancelled');
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const handleNext = () => {
    const {
      firstName,
      lastName,
      phoneNumber,
      address,
      age,
      licenseImageUri,
    } = route.params || {}; 

    // Navigate to the next screen with the collected data
    navigation.navigate('Routeinfo', {
      firstName,
      lastName,
      phoneNumber,
      address,
      age,
      licenseImageUri,
      selectedVehicle,
      model,
      vehicleImageUri: imageUri, // Pass the image URI directly
      seats,
      color,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <View style={styles.iconContainer}>
          <View style={styles.circle}>
            <TouchableOpacity style={styles.locationButton} onPress={() => navigation.navigate('PersonalInfo')}>
              <Icon name="user" size={30} color="#000" style={styles.icon} />
            </TouchableOpacity>
            <Text style={styles.text}>Personal</Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <Svg height="30" width="30">
            <Path d="M5 15 L25 15" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </View>
        <View style={styles.iconContainer}>
          <View style={styles.circle}>
            <TouchableOpacity style={styles.locationButton} onPress={() => navigation.navigate('VehicleInfo')}>
              <Icon name="car" size={30} color="#000" style={styles.icon} />
            </TouchableOpacity>
            <Text style={styles.text}>Vehicle</Text>
          </View>
        </View>
        <View style={styles.iconContainer}>
          <Svg height="30" width="30">
            <Path d="M5 15 L25 15" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </Svg>
        </View>
        <View style={styles.iconContainer}>
          <View style={styles.circle}>
            <TouchableOpacity style={styles.locationButton} onPress={() => navigation.navigate('Routeinfo')}>
              <Icon name="road" size={30} color="#000" style={styles.icon} />
            </TouchableOpacity>
            <Text style={styles.text}>Route</Text>
          </View>
        </View>
      </View>

      <View style={styles.borderform}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Type</Text>
          <Picker
            selectedValue={selectedVehicle}
            onValueChange={(itemValue) => setSelectedVehicle(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Car" value="Car" />
            <Picker.Item label="Van" value="Van" />
            <Picker.Item label="Truck" value="Truck" />
          </Picker>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Model</Text>
          <Picker
            selectedValue={model}
            onValueChange={(itemValue) => setModel(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="2019" value="2019" />
            <Picker.Item label="2020" value="2020" />
            <Picker.Item label="2021" value="2021" />
          </Picker>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Seats</Text>
          <Picker
            selectedValue={seats}
            onValueChange={(itemValue) => setSeats(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="1" value="1" />
            <Picker.Item label="2" value="2" />
            <Picker.Item label="3" value="3" />
          </Picker>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color</Text>
          <Picker
            selectedValue={color}
            onValueChange={(itemValue) => setColor(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Red" value="Red" />
            <Picker.Item label="Blue" value="Blue" />
            <Picker.Item label="Green" value="Green" />
          </Picker>
        </View>

        <View style={styles.imageContainer}>
          <Text style={styles.label}>Vehicle Image</Text>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          )}
          {uploading ? (
            <ActivityIndicator size="large" color="#32a4a8" />
          ) : (
            <Icon name="image" size={80} color="blue" onPress={handleChooseImage} />
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: '20%',
    alignItems: 'center',
  },
  circle: {
    width: 63,
    height: 63,
    borderRadius: 30,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#32a4a8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textAlign: 'center',
    lineHeight: 90,
  },
  text: {
    paddingTop: 19,
  },
  borderform: {
    flex: 1,
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  picker: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 50,
    height: 50,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#32a4a8',
    paddingVertical: 10,
    borderRadius: 5,
    width: '100%',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default VehicleInfo;
