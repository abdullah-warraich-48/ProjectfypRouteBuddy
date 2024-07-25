import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import driverprofile from '../Screen/driverprofile';
import MyIncome from '../Screen/MyIncome';
import NotificationReceiverScreen from '../Screen/NotificationReceiverScreen';
import Rating from '../Screen/Rating';

const DriverTab = createBottomTabNavigator();

const DriverHomeNavigation = () => {
  return (
    <DriverTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'NotificationScreen') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'MyIncome') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Rating') {
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
      <DriverTab.Screen name="NotificationScreen" component={NotificationReceiverScreen} />
      <DriverTab.Screen name="MyIncome" component={MyIncome} />
      <DriverTab.Screen name="Rating" component={Rating} />
      <DriverTab.Screen name="Profile" component={driverprofile} />
    </DriverTab.Navigator>
  );
};

export default DriverHomeNavigation;
