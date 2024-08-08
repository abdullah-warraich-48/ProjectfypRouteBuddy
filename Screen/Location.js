import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Button, StatusBar, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { firebase } from '../firebase/firebaseConfig';

const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';
const ROUTE_API_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const API_KEY = '5b3ce3597851110001cf62482c3d6949d511473b85ef5c97a257bd32';

export default function App() {
  const [startingLocation, setStartingLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 32.1614,
    longitude: 74.1883,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const mapRef = useRef(null);
  const watchId = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const requestLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setLiveLocation(coords);
      if (useCurrentLocation) {
        setStartCoords(coords);
      }
      setMapRegion({
        ...coords,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 1000);
      }

      startWatchingLocationUpdates();
    };

    const startWatchingLocationUpdates = async () => {
      watchId.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 10000,
        },
        (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setLiveLocation(coords);

          if (mapRef.current) {
            mapRef.current.animateToRegion({
              ...coords,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }, 1000);
          }
        }
      );
    };

    requestLocationPermission();

    return () => {
      if (watchId.current) {
        watchId.current.remove();
      }
    };
  }, [useCurrentLocation]);

  useEffect(() => {
    if (startCoords && endCoords) {
      fetchRoute();
    }
  }, [startCoords, endCoords]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const driverRef = firebase.database().ref('driverRef');
      const snapshot = await driverRef.once('value');
      const fetchedData = snapshot.exists() ? Object.entries(snapshot.val()) : [];
      setDrivers(fetchedData.map(([key, value]) => ({
        ...value,
        key,
      })));
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const fetchCoords = async (query, setCoords, setLocation) => {
    try {
      if (query.length < 3) return;

      const response = await axios.get(NOMINATIM_API_URL, {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
        },
      });

      if (response.data.length > 0) {
        const place = response.data[0];
        const coords = { latitude: parseFloat(place.lat), longitude: parseFloat(place.lon) };
        setCoords(coords);
        setLocation(place.display_name);
      } else {
        setCoords(null);
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
    }
  };

  const fetchRoute = async () => {
    if (startCoords && endCoords) {
      try {
        const response = await axios.get(ROUTE_API_URL, {
          params: {
            start: `${startCoords.longitude},${startCoords.latitude}`,
            end: `${endCoords.longitude},${endCoords.latitude}`,
            api_key: API_KEY,
          },
        });

        const features = response.data.features || [];
        if (features.length > 0) {
          const route = features[0];
          if (route && route.geometry && route.geometry.coordinates) {
            const coords = route.geometry.coordinates.map(coord => ({
              latitude: coord[1],
              longitude: coord[0],
            }));

            setRouteCoords(coords);

            if (mapRef.current) {
              mapRef.current.fitToCoordinates(coords, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }

            const { distance, duration } = route.properties.segments[0];
            setDistance((distance / 1000).toFixed(2));
            setDuration((duration / 3600).toFixed(2));
          }
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    }
  };

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    setEndCoords(coordinate);
    setDestinationLocation(`Lat: ${coordinate.latitude}, Lon: ${coordinate.longitude}`);

    if (startCoords) {
      fetchRoute();
    }
  };

  const handleInputSubmit = async (event, setCoords, setLocation) => {
    const query = event.nativeEvent.text;
    if (query.length > 2) {
      await fetchCoords(query, setCoords, setLocation);
    }
  };

  const handleCurrentLocationToggle = () => {
    if (useCurrentLocation) {
      setStartCoords(null);
      setLiveLocation(null);
    }
    setUseCurrentLocation(prev => !prev);
  };

  const handleRemoveDestination = () => {
    setEndCoords(null);
    setDestinationLocation('');
    setRouteCoords([]);
    setDistance(null);
    setDuration(null);
  };

  const handleFindDriver = () => {
    if (!startCoords || !endCoords) {
      alert('Please select a starting point and destination.');
      return;
    }

    const matchedDrivers = drivers.filter(driver =>
      driver.startLatitude === startCoords.latitude &&
      driver.startLongitude === startCoords.longitude &&
      driver.endLatitude === endCoords.latitude &&
      driver.endLongitude === endCoords.longitude
    );

    setFilteredDrivers(matchedDrivers);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Use Current Location:</Text>
          <Switch
            value={useCurrentLocation}
            onValueChange={handleCurrentLocationToggle}
          />
        </View>
        {!useCurrentLocation && (
          <TextInput
            style={styles.input}
            placeholder="Enter Starting Location"
            value={startingLocation}
            onChangeText={text => setStartingLocation(text)}
            onSubmitEditing={(event) => handleInputSubmit(event, setStartCoords, setStartingLocation)}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Enter Destination"
          value={destinationLocation}
          onChangeText={text => setDestinationLocation(text)}
          onSubmitEditing={(event) => handleInputSubmit(event, setEndCoords, setDestinationLocation)}
        />
        {endCoords && (
          <Button title="Remove Destination" onPress={handleRemoveDestination} />
        )}
      </View>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={mapRegion}
        mapType='standard'
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={true}
        onPress={handleMapPress}
      >
        {startCoords && (
          <Marker coordinate={startCoords} title="Starting Location" pinColor="blue" />
        )}
        {endCoords && (
          <Marker coordinate={endCoords} title="Destination Location" pinColor="red" />
        )}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
        )}
        {filteredDrivers.map((driver, index) => (
          driver.latitude && driver.longitude && (
            <Marker
              key={index}
              coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
              title={driver.name}
              description={driver.vehicle}
            />
          )
        ))}
      </MapView>
      {distance && duration && (
        <View style={styles.routeInfo}>
          <Text>Distance: {distance} km</Text>
          <Text>Duration: {duration} hrs</Text>
        </View>
      )}
      {routeCoords.length > 0 && (
        <Button title="Find Driver" onPress={handleFindDriver} />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputsContainer: {
    padding: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  map: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    marginRight: 10,
  },
  routeInfo: {
    padding: 10,
    backgroundColor: 'white',
  },
});
