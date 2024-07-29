import { useNavigation } from '@react-navigation/native';
import { get, onValue, push, ref, update } from 'firebase/database';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { UserContext } from '../context/UserContext';
import { firebase } from '../firebase/firebaseConfig';

const Notifications = () => {
  const navigation = useNavigation();
  const { currentUser } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState({});

  // Fetch all driver data
  const fetchAllDrivers = async () => {
    try {
      const driversRef = ref(firebase.database(), 'driverRef'); 
      const snapshot = await get(driversRef);

      if (snapshot.exists()) {
        const driversData = snapshot.val();
        setDrivers(driversData);
        
        //console.log(driversData);
      } else {
        console.log('No drivers data available');
      }
    } catch (error) {
      console.error('Error fetching drivers data:', error.message);
    }
  };

  // Fetch notifications function
  const fetchNotifications = () => {
    if (!currentUser) {
      console.warn('No current user found.');
      return;
    }

    const currentUserEmail = currentUser.email;
    const notificationsRef = ref(firebase.database(), 'notifications');

    // Listen for real-time updates
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      setLoading(true);
      const notificationsData = snapshot.val();
      const userNotifications = [];

      if (notificationsData) {
        for (const notificationKey in notificationsData) {
          const notification = notificationsData[notificationKey];

          // Validate the 'users' field
          if (Array.isArray(notification.users) && !notification.users.includes(undefined)) {
            // Check if current user is the recipient
            if (notification.users.includes(currentUserEmail)) {
              // Assume driver is always in the users array at index 1
              const driverId = notification.users[1];
              

              userNotifications.push({
                notificationId: notificationKey,
                senderEmail: notification.users[0],
                message: notification.message,
                status: notification.status || 'pending',
                driverId: driverId,
              });
            }
          } else {
            console.warn(`Invalid 'users' field in notification with ID: ${notificationKey}`);
          }
        }

        setNotifications(userNotifications);
      } else {
        setNotifications([]);
      }

      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  };

  // Handle accept notification
  const handleAccept = async (notificationId) => {
    Alert.alert(
      'Confirm Acceptance',
      'Are you sure you want to accept this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const notificationRef = ref(firebase.database(), `notifications/${notificationId}`);
              const snapshot = await get(notificationRef);

              if (snapshot.exists()) {
                const notification = snapshot.val();
                if (notification && Array.isArray(notification.users)) {
                  // Check if the current user is in the notification's users list
                  if (notification.users.includes(currentUser.email)) {
                    console.log(currentUser.email);
                    // Fetch driver data based on driverId
                    const driverId = notification.users[1]; // Index 1 represents the driver
                    const encodedDriverId = encodeURIComponent(driverId); // Encode driver ID
                    const driverRef = ref(firebase.database(), `drivers/${encodedDriverId}`);
                    const driverSnapshot = await get(driverRef);
                    
                    
                    if (driverSnapshot.exists()) {
                      const driverData = driverSnapshot.val();
                      // console.log(driverData);

                      // Update the notification status to 'accepted' and add the receiverId
                      await update(notificationRef, { status: 'accepted', receiverId: currentUser.uid });
                      console.log(`Accepted notification with ID: ${notificationId}`);

                      // Create a new notification for the sender
                      const senderNotificationRef = ref(firebase.database(), 'notifications');
                      const newNotification = {
                        senderEmail: currentUser.email,
                        users: [notification.users[0]], // Use senderEmail as the recipient
                        message: `Your request has been accepted by ${currentUser.email}`,
                        status: 'pending',
                      };
                      await push(senderNotificationRef, newNotification);
                      console.log('Notification sent to the sender about acceptance.');

                      // Navigate to booking screen and pass driver data
                      navigation.navigate('Booking', {
                        driverData: {
                          arrivalTime: driverData.arrivalTime,
                          departureTime: driverData.departureTime,
                          destination: driverData.destination,
                          price: driverData.price,
                        }
                      });
                    } else {
                      console.error(`Driver data does not exist for driverId: ${encodedDriverId}`);
                    }
                  } else {
                    console.error('Current user is not in the notification users list.');
                  }
                } else {
                  console.error('Invalid notification structure:', notification);
                }
              } else {
                console.error('Notification does not exist:', notificationId);
              }
            } catch (error) {
              console.error('Error accepting notification:', error.message);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Handle decline notification
  const handleDecline = async (notificationId) => {
    try {
      const notificationRef = ref(firebase.database(), `notifications/${notificationId}`);
      const snapshot = await get(notificationRef);

      if (snapshot.exists()) {
        const notification = snapshot.val();
        if (notification && Array.isArray(notification.users)) {
          // Check if the current user is in the notification's users list
          if (notification.users.includes(currentUser.email)) {
            // Update the notification status to 'declined'
            await update(notificationRef, { status: 'declined' });
            console.log(`Declined notification with ID: ${notificationId}`);
          } else {
            console.error('Current user is not in the notification users list.');
          }
        } else {
          console.error('Invalid notification structure:', notification);
        }
      } else {
        console.error('Notification does not exist:', notificationId);
      }
    } catch (error) {
      console.error('Error declining notification:', error.message);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      fetchAllDrivers(); // Fetch all drivers data when the component mounts
    }
  }, [currentUser]);

  const renderItem = ({ item }) => {
    const driverData = item.driverId ? drivers[item.driverId] : null; // Access driver data directly by driverId

    return (
      <View style={styles.notificationCard}>
        <Text style={styles.senderEmail}>{item.senderEmail}</Text>
        <Text style={styles.message}>{item.message}</Text>
        {driverData && (
          <View style={styles.driverInfo}>
            <Text>Driver Name: {driverData.name}</Text> {/* Assuming 'name' field exists */}
            <Text>Driver Email: {driverData.email}</Text>
          </View>
        )}
        {item.status === 'pending' && (
          <View style={styles.buttonContainer}>
            <Button title="Accept" onPress={() => handleAccept(item.notificationId)} />
            <Button title="Decline" onPress={() => handleDecline(item.notificationId)} />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList data={notifications} keyExtractor={(item) => item.notificationId} renderItem={renderItem} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  notificationCard: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  senderEmail: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    color: '#555',
  },
  driverInfo: {
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default Notifications;
