import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

// Constants
const ROUTE_API_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const API_KEY = '5b3ce3597851110001cf62482c3d6949d511473b85ef5c97a257bd32';

export default function DriverLocation({ route }) {
  const { startPoint, destination } = route.params || {};
  const [startCoords, setStartCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
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

  useEffect(() => {
    console.log('Route Params:', route.params); // Log route parameters

    if (startPoint && destination) {
      const startCoordinates = parseCoordinates(startPoint);
      const destinationCoordinates = parseCoordinates(destination);

      console.log('Start Coordinates:', startCoordinates);
      console.log('Destination Coordinates:', destinationCoordinates);

      if (startCoordinates && destinationCoordinates) {
        setStartCoords(startCoordinates);
        setDestinationCoords(destinationCoordinates);

        setMapRegion({
          latitude: (startCoordinates.latitude + destinationCoordinates.latitude) / 2,
          longitude: (startCoordinates.longitude + destinationCoordinates.longitude) / 2,
          latitudeDelta: Math.abs(startCoordinates.latitude - destinationCoordinates.latitude) * 2,
          longitudeDelta: Math.abs(startCoordinates.longitude - destinationCoordinates.longitude) * 2,
        });

        fetchRoute(startCoordinates, destinationCoordinates);
      } else {
        console.error('Invalid start or destination coordinates');
      }
    } else {
      console.error('Starting point or destination is missing in driver data');
    }
  }, [startPoint, destination]);

  const parseCoordinates = (coordString) => {
    // Parse the coordinate string like "Lat: 32.20483729513639, Lon: 74.1761989519"
    const regex = /Lat:\s*([\d.]+),\s*Lon:\s*([\d.]+)/;
    const match = coordString.match(regex);
    
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
      };
    }
    return null;
  };

  const isValidCoords = (coords) => {
    return (
      coords &&
      typeof coords.latitude === 'number' &&
      typeof coords.longitude === 'number' &&
      !isNaN(coords.latitude) &&
      !isNaN(coords.longitude)
    );
  };

  const fetchRoute = async (startCoords, destinationCoords) => {
    if (!isValidCoords(startCoords) || !isValidCoords(destinationCoords)) {
      console.error('Start or destination coordinates are missing');
      return;
    }

    try {
      const requestUrl = `${ROUTE_API_URL}?start=${startCoords.longitude},${startCoords.latitude}&end=${destinationCoords.longitude},${destinationCoords.latitude}&api_key=${API_KEY}`;
      console.log('Request URL:', requestUrl);

      const response = await axios.get(requestUrl);

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

          if (distance !== undefined && duration !== undefined) {
            const distanceInKm = distance / 1000;
            const durationInHours = duration / 3600;

            setDistance(distanceInKm.toFixed(2));
            setDuration(durationInHours.toFixed(2));
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
      console.error('Error fetching route:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={mapRegion} // Set the map region based on the route
        mapType="standard"
        showsUserLocation={false}
        followsUserLocation={false}
        showsMyLocationButton={false}
      >
        {startCoords && (
          <Marker coordinate={startCoords} title="Start Location" pinColor="green" />
        )}
        {destinationCoords && (
          <Marker coordinate={destinationCoords} title="Destination Location" pinColor="red" />
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
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
