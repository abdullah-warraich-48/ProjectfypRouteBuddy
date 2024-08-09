import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { onValue, push, ref, set } from 'firebase/database';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserContext } from '../context/UserContext';
import { firebase } from '../firebase/firebaseConfig'; // Adjust import path as per your project structure

const Driver = ({ route }) => {
  const navigation = useNavigation();
  const { currentUser } = useContext(UserContext);
  const [chatId, setChatId] = useState(null);
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState('');
  const [vehiclePics, setVehiclePics] = useState([]);
  const [completeDriverData, SetCompleteDriverData] = useState();
  const currentUserEmail = currentUser?.email;
  const { driverData } = route?.params || {}; //console.log(driverData)

  useEffect(() => {
    const fetchChatId = async () => {
      try {
        const chatsRef = ref(firebase.database(), 'chats');
        onValue(chatsRef, (snapshot) => {
          const chatsData = snapshot.val();
          let existingChatId = null;
          for (const chatKey in chatsData) {
            const chat = chatsData[chatKey];
            if (chat.users.includes(currentUserEmail) && chat.users.includes(driverData?.email)) {
              existingChatId = chatKey;
              break;
            }
          }
          if (existingChatId) {
            setChatId(existingChatId);
            setChat(chatsData[existingChatId]);
          } else {
            const newChatRef = push(chatsRef);
            set(newChatRef, {
              users: [currentUserEmail, driverData.email],
              messages: {},
            }).then(() => {
              setChatId(newChatRef.key); // Use newChatRef.key to set chatId
            });
          }
          setLoading(false);
        });
      } catch (error) {
        console.error('Error fetching chat ID:', error.message);
        setLoading(false); // Ensure loading state is updated on error
      }
    };

    const fetchDriverData = async () => {
      try {
        const driverRef = ref(firebase.database(), `driverRef/${driverData?.id}`);
        onValue(driverRef, (snapshot) => {
          const driver = snapshot.val();
          SetCompleteDriverData(driver);
          if (driver) {
            console.log("-=======",driver)
            setProfilePic(driver.profilePic || ''); // Fetch profile picture URL
            setVehiclePics(driver.vehiclePics || []); // Fetch vehicle pictures
          }
        });
      } catch (error) {
        console.error('Error fetching driver data:', error.message);
      }
    };

    if (currentUser && driverData) {
      fetchChatId();
      fetchDriverData();
    }
  }, [currentUserEmail, driverData?.email, currentUser, driverData]);

  if (!driverData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Driver data not provided.</Text>
      </View>
    );
  }

  const handleRequest = async () => {
    try {
      if (!driverData || !currentUser) {
        Alert.alert('Error', 'Driver or user data is missing.');
        return;
      }
  
      // Check for existing pending requests
      const notificationsRef = ref(firebase.database(), 'notifications');
      onValue(notificationsRef, async (snapshot) => {
        const notificationsData = snapshot.val();
        let requestExists = false;
  
        if (notificationsData) {
          for (const notificationKey in notificationsData) {
            const notification = notificationsData[notificationKey];
            if (
              notification.users.includes(currentUser.email) &&
              notification.users.includes(driverData.email) &&
              notification.status === 'pending'
            ) {
              requestExists = true;
              break;
            }
          }
        }
  
        if (requestExists) {
          Alert.alert('Request Already Sent', 'You have already sent a request to this driver. Please wait for their response.');
        } else {
          // Send a new request
          const newNotificationRef = push(notificationsRef);
          const notificationData = {
            title: 'New Request',
            message: `You sent a request from ${currentUser.email} for driver ${driverData.firstName}.`,
            timestamp: Date.now(),
            users: [currentUser.email, driverData.email],
            status: 'pending',
          };
  
          console.log('Notification Data:', notificationData);
          await set(newNotificationRef, notificationData);
          Alert.alert('Request Sent', `Your request has been sent to ${driverData.firstName}.`, [
            { text: 'OK', onPress: () => navigation.navigate('NotificationScreen') }
          ]);
        }
      });
    } catch (error) {
      console.error('Error sending request:', error.message);
      Alert.alert('Error', 'Failed to send request. Please try again later.');
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Image source={{ uri: profilePic }} style={styles.profilePicture} />
        <Text style={styles.name}>{driverData?.firstName + " " + driverData?.lastName}</Text>
        <Text style={styles.number}>{driverData?.number}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('chat', { chatId: chatId, driverId: driverData?.id, chatData: chat })}
        >
          <Text style={styles.buttonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleRequest}>
          <Text style={styles.buttonText}>Request</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('feedback', { receiverId: driverData.email })}
        >
          <FontAwesome name="star" size={24} color="black" />
          <Text style={styles.optionLabel}>Rate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('seats')}>
          <FontAwesome name="calendar" size={24} color="black" />
          <Text style={styles.optionLabel}>Availability</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => {
          console.log("______________",completeDriverData);
          
          navigation.navigate('driverLocation', { startPoint: completeDriverData.startPoint, destination: completeDriverData.destination });

          
          
          }}>
          <FontAwesome name="map-marker" size={24} color="black" />
          <Text style={styles.optionLabel}>Location</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Vehicle</Text>
      <View style={styles.vehicleContainer}>
        {vehiclePics.slice(0, 2).map((vehiclePic, index) => (
          <Image key={index} style={styles.vehiclePicture} source={{ uri: vehiclePic }} />
        ))}
      </View>
      <View style={styles.vehicleContainer}>
        {vehiclePics.slice(2, 4).map((vehiclePic, index) => (
          <Image key={index} style={styles.vehiclePicture} source={{ uri: vehiclePic }} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  number: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#32a4a8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    width: '40%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    padding: 20,
    borderRadius: 15,
  },
  option: {
    alignItems: 'center',
  },
  optionLabel: {
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
  vehicleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  vehiclePicture: {
    width: '48%',
    height: 120,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default Driver;