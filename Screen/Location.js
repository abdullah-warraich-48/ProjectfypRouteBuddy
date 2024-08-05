import axios from 'axios';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Button, StatusBar, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

// Constants
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
    latitude: 32.1614, // Default to Gujranwala, Pakistan
    longitude: 74.1883,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(true); // State to manage location usage
  const mapRef = useRef(null);
  const watchId = useRef(null);

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
        setStartCoords(coords); // Set starting coordinates to user's current location
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
        }, 1000); // 1-second animation duration
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

          console.log('Live Location Updated:', coords); // Log location updates

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
  }, [useCurrentLocation]);

  useEffect(() => {
    if (startCoords && endCoords) {
      fetchRoute();
    }
  }, [startCoords, endCoords]);

  const fetchCoords = async (query, setCoords, setLocation) => {
    try {
      if (query.length < 3) return; // Start searching after 3 characters

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

            const { distance, duration } = route.properties.segments[0];

            // Convert distance from meters to kilometers
            const distanceInKm = distance / 1000;

            // Convert duration from seconds to hours
            const durationInHours = duration / 3600;

            setDistance(distanceInKm.toFixed(2)); // Format to 2 decimal places
            setDuration(durationInHours.toFixed(2)); // Format to 2 decimal places
          } else {
            console.log('No route geometry found in response');
          }
        } else {
          console.log('No features found in route response');
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    } else {
      console.log('Start or End coordinates are missing');
    }
  };

  const handleMapPress = (event) => {
    const { coordinate } = event.nativeEvent;
    console.log('Map Pressed at:', coordinate); // Debugging log for pressed coordinates

    // Set destination coordinates
    setEndCoords(coordinate);
    setDestinationLocation(`Lat: ${coordinate.latitude}, Lon: ${coordinate.longitude}`);
    console.log('End Coordinates set:', coordinate); // Debugging log

    // Fetch route if starting and ending coordinates are set
    if (startCoords) {
      fetchRoute();
    }
  };

  const handleInputSubmit = async (event, setCoords, setLocation) => {
    const query = event.nativeEvent.text;
    console.log('Submitted Query:', query); // Debugging log
    if (query.length > 2) {
      await fetchCoords(query, setCoords, setLocation);
    }
  };

  const handleCurrentLocationToggle = () => {
    if (useCurrentLocation) {
      // Clear start coordinates and live location if switching to manual input
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
        region={mapRegion} // Set the map region based on user's location
        mapType='standard'
        onPress={handleMapPress}
      >
        {startCoords && (
          <Marker coordinate={startCoords} title="Start Location" />
        )}
        {endCoords && (
          <Marker coordinate={endCoords} title="Destination Location" />
        )}
        {liveLocation && (
          <Marker coordinate={liveLocation} title="Live Location" pinColor="blue" />
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#FF0000"
            strokeWidth={3}
          />
        )}
      </MapView>
      <View style={styles.routeInfoContainer}>
        {distance && duration && (
          <>
            <Text style={styles.routeInfoText}>Distance: {distance} km</Text>
            <Text style={styles.routeInfoText}>Duration: {duration} hrs</Text>
          </>
        )}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputsContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
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
  routeInfoContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  routeInfoText: {
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 16,
    marginRight: 10,
  },
});

