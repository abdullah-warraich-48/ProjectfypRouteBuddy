import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Button, StatusBar, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { firebase } from '../firebase/firebaseConfig'; // Import firebase instance

// Constants
const ROUTE_API_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const API_KEY = '5b3ce3597851110001cf62482c3d6949d511473b85ef5c97a257bd32';

export default function DriverLocation() {
  const [endCoords, setEndCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 32.1614, // Default to Gujranwala, Pakistan
    longitude: 74.1883,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef(null);
  const watchId = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();

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
        }, 1000); // 1-second animation duration
      }

      startWatchingLocationUpdates();
    };

    const startWatchingLocationUpdates = async () => {
      if (watchId.current) {
        watchId.current.remove();
      }

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

          if (mapRef.current) {
            mapRef.current.animateToRegion({
              ...coords,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }, 1000); // 1-second animation duration
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
  }, []);

  useEffect(() => {
    const fetchDriverData = async () => {
      const driverId = route.params?.driverId; // Get driver ID from route params
      if (driverId) {
        try {
          const snapshot = await firebase.database().ref(`drivers/${driverId}`).once('value');
          const driverData = snapshot.val();

          if (driverData) {
            const { startingPoint, destination } = driverData;

            if (startingPoint && destination) {
              const startCoords = {
                latitude: startingPoint.latitude,
                longitude: startingPoint.longitude,
              };
              const endCoords = {
                latitude: destination.latitude,
                longitude: destination.longitude,
              };

              // Update map region
              setMapRegion({
                latitude: (startCoords.latitude + endCoords.latitude) / 2,
                longitude: (startCoords.longitude + endCoords.longitude) / 2,
                latitudeDelta: Math.abs(startCoords.latitude - endCoords.latitude) * 2,
                longitudeDelta: Math.abs(startCoords.longitude - endCoords.longitude) * 2,
              });

              // Set coordinates for route
              setEndCoords(endCoords);

              // Fetch route
              fetchRoute(startCoords, endCoords);
            } else {
              console.error('Starting point or destination is missing in driver data');
            }
          } else {
            console.error('Driver data not found');
          }
        } catch (error) {
          console.error("Error fetching driver data:", error);
        }
      } else {
        console.error('Driver ID is missing from route params');
      }
    };

    fetchDriverData();
  }, [route.params]);

  const fetchRoute = async (startCoords, endCoords) => {
    if (!startCoords || !endCoords) {
      console.error('Start or End coordinates are missing');
      return;
    }

    try {
      const response = await axios.get(ROUTE_API_URL, {
        params: {
          start: `${startCoords.longitude},${startCoords.latitude}`,
          end: `${endCoords.longitude},${endCoords.latitude}`,
          api_key: API_KEY,
        },
      });

      console.log('Route API Response:', response.data);

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

          const segment = route.properties.segments[0] || {};
          const { distance, duration } = segment;

          // Ensure distance and duration are defined
          if (distance !== undefined && duration !== undefined) {
            // Convert distance from meters to kilometers
            const distanceInKm = distance / 1000;

            // Convert duration from seconds to hours
            const durationInHours = duration / 3600;

            setDistance(distanceInKm.toFixed(2)); // Format to 2 decimal places
            setDuration(durationInHours.toFixed(2)); // Format to 2 decimal places
          } else {
            console.error('Distance or duration is missing in route response');
          }
        } else {
          console.error('No route geometry found in response');
        }
      } else {
        console.error('No features found in route response');
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const handleRemoveDestination = () => {
    setEndCoords(null);
    setRouteCoords([]);
    setDistance(null);
    setDuration(null);
  };

  const handleFindDriver = () => {
    navigation.navigate('Map'); // Navigate to the Map screen
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        {endCoords && (
          <Button title="Remove Destination" onPress={handleRemoveDestination} />
        )}
      </View>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={mapRegion} // Set the map region based on user's location
        mapType='standard'
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={true}
        // Removed onPress handler
      >
        {endCoords && (
          <Marker coordinate={endCoords} title="Destination Location" pinColor="red" />
        )}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>
      {distance && duration && (
        <View style={styles.routeInfo}>
          <Text>Distance: {distance} km</Text>
          <Text>Duration: {duration} hrs</Text>
        </View>
      )}
      {routeCoords.length > 0 && (
        <Button title="Find Driver" onPress={handleFindDriver} /> // Conditional "Find Driver" button
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
  map: {
    flex: 1,
  },
  routeInfo: {
    padding: 10,
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
  },
});
