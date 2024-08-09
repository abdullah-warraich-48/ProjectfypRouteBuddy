import { useNavigation } from '@react-navigation/native';
import { onValue, ref } from 'firebase/database';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { UserContext } from '../context/UserContext';
import { firebase } from '../firebase/firebaseConfig';

const Notifications = () => {
  const navigation = useNavigation();
  const { currentUser } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications function with real-time updates
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

          // Check if current user is the recipient
          if (notification.users.includes(currentUserEmail)) {
            userNotifications.push({
              notificationId: notificationKey,
              senderEmail: notification.senderEmail,
              message: notification.message,
              status: notification.status || 'pending',
            });
          }
        }
        userNotifications.reverse();
        setNotifications(userNotifications);
      } else {
        console.warn('No notifications data available.');
      }

      setLoading(false);
    }, (error) => {
      console.error('Error listening for notifications:', error.message);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  const renderItem = ({ item }) => (
    <View style={styles.notificationCard}>
      <Text style={styles.senderEmail}>{item.senderEmail}</Text>
      <Text style={styles.message}>{item.message}</Text>
    </View>
  );

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
});

export default Notifications;
