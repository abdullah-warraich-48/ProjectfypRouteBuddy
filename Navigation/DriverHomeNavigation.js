import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import driverprofile from '../Screen/driverprofile';
import Messages from '../Screen/Messages';
import ratingscreen from '../Screen/ratingscreen';
import RideRequest from '../Screen/RideRequest';

const DriverTab = createBottomTabNavigator();

const DriverHomeNavigation = () => {
  return (
    <DriverTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'RideRequest') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'ratingscreen') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'driverprofile') {
            iconName = focused ? '' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: '#32a4a8',
        inactiveTintColor: 'gray',
      }}
    >
      <DriverTab.Screen name="RideRequest" component={RideRequest} />
      <DriverTab.Screen name="Messages" component={Messages} />
      <DriverTab.Screen name="ratingscreen" component={ratingscreen} />
      <DriverTab.Screen name="Profile" component={driverprofile} />
    </DriverTab.Navigator>
  );
};

export default DriverHomeNavigation;
