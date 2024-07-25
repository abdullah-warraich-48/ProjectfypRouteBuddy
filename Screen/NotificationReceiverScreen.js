import { useNavigation } from '@react-navigation/native';
import { get, ref } from 'firebase/database';
import React, { useContext, useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { UserContext } from '../context/UserContext';
import { firebase } from '../firebase/firebaseConfig';

const Notifications = () => {
  const navigation = useNavigation();
  const { currentUser } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!currentUser) {
      console.warn('No current user found.');
      return;
    }

    const currentUserEmail = currentUser.email;
    const notificationsRef = ref(firebase.database(), 'notifications');

    try {
      setLoading(true);
      const snapshot = await get(notificationsRef);

      if (snapshot.exists()) {
        const notificationsData = snapshot.val();
        const userNotifications = [];

        for (const notificationKey in notificationsData) {
          const notification = notificationsData[notificationKey];

          if (notification.recipientEmail === currentUserEmail) {
            userNotifications.push({
              notificationId: notificationKey,
              senderEmail: notification.senderEmail,
              message: notification.message,
              status: notification.status || 'pending',
            });
          }
        }

        setNotifications(userNotifications);
      } else {
        console.warn('No notifications data available.');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error.message);
      setLoading(false);
    }
  };

  const handleAccept = (notificationId) => {
    console.log(`Accepted notification with ID: ${notificationId}`);
    // Update notification status in Firebase
    // Additional logic for accepting the notification
  };

  const handleDecline = (notificationId) => {
    console.log(`Declined notification with ID: ${notificationId}`);
    // Update notification status in Firebase
    // Additional logic for declining the notification
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications().catch(error => {
        console.error('Error in useEffect fetching notifications:', error.message);
      });
    }
  }, [currentUser]);

  const renderItem = ({ item }) => (
    <View style={styles.notificationCard}>
      <Text style={styles.senderEmail}>{item.senderEmail}</Text>
      <Text style={styles.message}>{item.message}</Text>
      {item.status === 'pending' && (
        <View style={styles.buttonContainer}>
          <Button title="Accept" onPress={() => handleAccept(item.notificationId)} />
          <Button title="Decline" onPress={() => handleDecline(item.notificationId)} />
        </View>
      )}
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default Notifications;
