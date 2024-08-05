import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { firebase } from '../firebase/firebaseConfig'; // Import Firebase configuration

const VehicleInfo = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedVehicle, setSelectedVehicle] = useState('Car');
  const [model, setModel] = useState('2019');
  const [images, setImages] = useState([]); // Store multiple images
  const [seats, setSeats] = useState('1');
  const [color, setColor] = useState('Red');
  const [uploading, setUploading] = useState(false);
  const [dropdownData, setDropdownData] = useState({
    vehicles: ['Car', 'Van', 'CarryBox', 'Rikshaw', 'Bike'],
    models: ['2019', '2020', '2021', '2022', '2023', '2024'],
    seats: ['1', '2', '3', '4', '5', '6'],
    colors: ['Red', 'Blue', 'Green'],
  });

  useEffect(() => {
    fetchDropdownData();
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to select images.');
      }
    })();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const snapshot = await firebase.database().ref('dropdownData').once('value');
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDropdownData(data);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error.message);
    }
  };

  const handleChooseImages = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true, // Allows multiple image selection
        quality: 1,
      });

      if (!result.canceled) {
        const newImages = result.assets;
        if (newImages.length + images.length > 4) {
          Alert.alert('Limit Exceeded', 'You can only select up to 4 images.');
        } else {
          setImages([...images, ...newImages]);
        }
      } else {
        console.log('Image selection cancelled');
      }
    } catch (error) {
      console.error('Error selecting images:', error);
    }
  };

  const uploadImages = async (uris) => {
    try {
      setUploading(true);
      const uploadPromises = uris.map(async (uri) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(firebase.storage(), `vehicles/${Date.now()}_${Math.random()}`);
        await uploadBytes(storageRef, blob);
        return getDownloadURL(storageRef);
      });
      const urls = await Promise.all(uploadPromises);
      setUploading(false);
      return urls;
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploading(false);
      throw error;
    }
  };

  const handleNext = async () => {
    if (images.length !== 4) {
      Alert.alert('Validation Error', 'Please select exactly 4 images before proceeding.');
      return;
    }

    let vehicleImageUrls = [];
   
    try {
      vehicleImageUrls = await uploadImages(images.map(image => image.uri));
    } catch (error) {
      console.error('Error uploading images:', error);
      Alert.alert('Upload Failed', 'There was an issue uploading the images. Please try again.');
      return;
    }
   // console.log(vehicleImageUrls);

    navigation.navigate('Routeinfo', {
      ...route.params,
      vehicleType: selectedVehicle,
      model,
      vehicleImageUris: vehicleImageUrls, // Pass image URLs to next screen
      seats,
      color,
    });
    console.log(vehicleImageUrls);
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
          <View style={styles.circle}>
            <TouchableOpacity style={styles.locationButton} onPress={() => navigation.navigate('VehicleInfo')}>
              <Icon name="car" size={30} color="#000" style={styles.icon} />
            </TouchableOpacity>
            <Text style={styles.text}>Vehicle</Text>
          </View>
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

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.borderform}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Type</Text>
            <Picker
              selectedValue={selectedVehicle}
              onValueChange={(itemValue) => setSelectedVehicle(itemValue)}
              style={styles.picker}
            >
              {dropdownData.vehicles.map((vehicle, index) => (
                <Picker.Item key={index} label={vehicle} value={vehicle} />
              ))}
            </Picker>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model</Text>
            <Picker
              selectedValue={model}
              onValueChange={(itemValue) => setModel(itemValue)}
              style={styles.picker}
            >
              {dropdownData.models.map((model, index) => (
                <Picker.Item key={index} label={model} value={model} />
              ))}
            </Picker>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seats</Text>
            <Picker
              selectedValue={seats}
              onValueChange={(itemValue) => setSeats(itemValue)}
              style={styles.picker}
            >
              {dropdownData.seats.map((seat, index) => (
                <Picker.Item key={index} label={seat} value={seat} />
              ))}
            </Picker>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <Picker
              selectedValue={color}
              onValueChange={(itemValue) => setColor(itemValue)}
              style={styles.picker}
            >
              {dropdownData.colors.map((color, index) => (
                <Picker.Item key={index} label={color} value={color} />
              ))}
            </Picker>
          </View>

          <View style={styles.imageContainer}>
            <TouchableOpacity onPress={handleChooseImages}>
              <Icon name="image" size={30} color="blue" />
            </TouchableOpacity>
            {images.length > 0 && (
              <>
                <Text style={styles.imageSelectedText}>{images.length} images selected</Text>
                <View style={styles.imagePreview}>
                  {images.map((image, index) => (
                    <Image
                      key={index}
                      source={{ uri: image.uri }}
                      style={styles.selectedImage}
                    />
                  ))}
                </View>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  text: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContainer: {
    flex: 1,
    marginTop: 10,
  },
  borderform: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  picker: {
    height: 50,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  imageContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  imageSelectedText: {
    marginTop: 5,
    color: 'blue',
  },
  imagePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  selectedImage: {
    width: 100,
    height: 100,
    margin: 5,
  },
  button: {
    backgroundColor: '#32a4a8',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VehicleInfo;
