import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import { Button, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserContext } from '../context/UserContext';
import { firebase } from '../firebase/firebaseConfig';

const Map = () => {
  const navigation = useNavigation();
  const { currentUser } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedTime, setSelectedTime] = useState('All');
  const [selectedVehicle, setSelectedVehicle] = useState('All');
  const [selectedSpecificVehicle, setSelectedSpecificVehicle] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');
  const [selectedSubOperator, setSelectedSubOperator] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [availableTimes, setAvailableTimes] = useState(['All']);
  const [availableVehicles, setAvailableVehicles] = useState(['All']);
  const [availableSpecificVehicles, setAvailableSpecificVehicles] = useState(['All']);
  const [availablePrices, setAvailablePrices] = useState(['All']);
  const [availableSubOperators, setAvailableSubOperators] = useState(['All']);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const driverRef = firebase.database().ref('driverRef');
        const snapshot = await driverRef.once('value');

        const fetchedData = snapshot.exists() ? Object.entries(snapshot.val()) : [];
        console.log(fetchedData);

        const formattedData = fetchedData.map(([key, value]) => ({
          id: key,
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email,
          phoneNumber: value.phoneNumber,
          vehicleType: value.vehicleType,
          specificVehicle: value.specificVehicle || 'N/A',
          price: value.price,
          time: value.time,
          subOperator: value.subOperator || 'N/A',
          licenseImageUrl: value.licenseImageUrl || "https://firebasestorage.googleapis.com/v0/b/route-budy-a5648.appspot.com/o/vehicles%2F1720670511070?alt=media&token=32977150-e705-4aeb-99e6-d1a89cf67b4b",
        }));

        const filteredData = formattedData.filter(driver => driver.email !== currentUser.email);

        setData(filteredData);
        setFilteredData(filteredData);

        const uniqueTimes = [...new Set(filteredData.map(driver => driver.time))];
        const uniqueVehicles = [...new Set(filteredData.map(driver => driver.vehicleType))];
        const uniqueSpecificVehicles = [...new Set(filteredData.map(driver => driver.specificVehicle))];
        const uniquePrices = ['<10000', '10000-20000', '>20000'];
        const uniqueSubOperators = [...new Set(filteredData.map(driver => driver.subOperator))];

        const vehicleOptions = ['Van', 'Carrybox', 'Bike', 'Rikshaw', ...uniqueVehicles.filter(Boolean)];

        setAvailableTimes(['All', ...uniqueTimes.filter(Boolean)]);
        setAvailableVehicles(['All', ...vehicleOptions.filter(Boolean)]);
        setAvailableSpecificVehicles(['All', ...uniqueSpecificVehicles.filter(Boolean)]);
        setAvailablePrices(['All', ...uniquePrices]);
        setAvailableSubOperators(['All', ...uniqueSubOperators.filter(Boolean)]);
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const applyFilters = () => {
    let filtered = data;

    filtered = filtered.filter(driver => {
      const matchesTime = selectedTime === 'All' || (driver.time && driver.time === selectedTime);
      const matchesVehicle = selectedVehicle === 'All' || (driver.vehicleType && driver.vehicleType === selectedVehicle);
      const matchesSpecificVehicle = selectedSpecificVehicle === 'All' || (driver.specificVehicle && driver.specificVehicle === selectedSpecificVehicle);
      const matchesPrice = selectedPrice === 'All' ||
        (selectedPrice === '<10000' && parseFloat(driver.price) < 10000) ||
        (selectedPrice === '10000-20000' && parseFloat(driver.price) >= 10000 && parseFloat(driver.price) <= 20000) ||
        (selectedPrice === '>20000' && parseFloat(driver.price) > 20000);
      const matchesSubOperator = selectedSubOperator === 'All' || (driver.subOperator && driver.subOperator === selectedSubOperator);

      return matchesTime && matchesVehicle && matchesSpecificVehicle && matchesPrice && matchesSubOperator;
    });

    setFilteredData(filtered);
    setModalVisible(false);
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => {
          try {
            navigation.navigate('Driver', { driverData: item });
          } catch (e) {
            console.error('Navigation error:', e.message);
          }
        }}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.licenseImageUrl }} style={styles.image} />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.driverName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.vehicleDetails}>
            Vehicle: {item.vehicleType || 'N/A'}
          </Text>
          <Text style={styles.paymentInfo}>
            Monthly PKR: {item.price || 'N/A'}
          </Text>
          <Text style={styles.subOperatorInfo}>
            Sub-Operator: {item.subOperator || 'N/A'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Drivers</Text>

      <TouchableOpacity
        style={styles.applyFiltersButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select Filters</Text>

            <Picker
              selectedValue={selectedTime}
              style={styles.dropdown}
              onValueChange={(itemValue) => setSelectedTime(itemValue)}
            >
              {availableTimes.map((time, index) => (
                <Picker.Item key={index} label={time} value={time} />
              ))}
            </Picker>

            <Picker
              selectedValue={selectedVehicle}
              style={styles.dropdown}
              onValueChange={(itemValue) => setSelectedVehicle(itemValue)}
            >
              {availableVehicles.map((vehicle, index) => (
                <Picker.Item key={index} label={vehicle} value={vehicle} />
              ))}
            </Picker>

            <Picker
              selectedValue={selectedSpecificVehicle}
              style={styles.dropdown}
              onValueChange={(itemValue) => setSelectedSpecificVehicle(itemValue)}
            >
              {availableSpecificVehicles.map((specificVehicle, index) => (
                <Picker.Item key={index} label={specificVehicle} value={specificVehicle} />
              ))}
            </Picker>

            <Picker
              selectedValue={selectedPrice}
              style={styles.dropdown}
              onValueChange={(itemValue) => setSelectedPrice(itemValue)}
            >
              {availablePrices.map((price, index) => (
                <Picker.Item key={index} label={price} value={price} />
              ))}
            </Picker>

            <Picker
              selectedValue={selectedSubOperator}
              style={styles.dropdown}
              onValueChange={(itemValue) => setSelectedSubOperator(itemValue)}
            >
              {availableSubOperators.map((subOperator, index) => (
                <Picker.Item key={index} label={subOperator} value={subOperator} />
              ))}
            </Picker>

            <Button title="Apply" onPress={applyFilters} />
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.scrollContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: 80,
    height: 80,
    marginRight: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  detailsContainer: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  vehicleDetails: {
    fontSize: 14,
    marginTop: 5,
  },
  paymentInfo: {
    fontSize: 14,
    marginTop: 5,
    color: '#28a745',
  },
  subOperatorInfo: {
    fontSize: 14,
    marginTop: 5,
    color: '#6c757d',
  },
  applyFiltersButton: {
    marginBottom: 20,
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 10,
  },
  applyFiltersButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dropdown: {
    width: '100%',
    marginBottom: 15,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
});

export default Map;
