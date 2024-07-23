import { useNavigation } from '@react-navigation/native';
import { get, ref } from 'firebase/database';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserContext } from '../context/UserContext';
import { firebase } from '../firebase/firebaseConfig';

// Import a constant image for default avatars
const DEFAULT_AVATAR = require('../assets/a.jpg');

const Myincome = () => {
  const navigation = useNavigation();
  const { currentUser } = useContext(UserContext);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserName = async (userId) => {
    if (!userId) {
      console.warn('No user ID provided.');
      return {
        name: 'Unknown User',
        avatar: DEFAULT_AVATAR, // Use the constant image
      };
    }

    try {
      const usersRef = ref(firebase.database(), `driverRef/${userId}`);
      const snapshot = await get(usersRef);

      console.log(`Fetching user data for ID: ${userId}`);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        console.log("Fetched user data:", userData);
        const { firstName, lastName, avatar } = userData;
        return {
          name: firstName && lastName ? `${firstName} ${lastName}` : 'Unknown User',
          avatar: avatar ? { uri: avatar } : DEFAULT_AVATAR, // Use the constant image if no avatar is available
        };
      } else {
        console.warn(`User with ID ${userId} does not exist.`);
        return {
          name: 'Unknown User',
          avatar: DEFAULT_AVATAR, // Use the constant image
        };
      }
    } catch (error) {
      console.error('Error fetching user name:', error.message);
      return {
        name: 'Unknown User',
        avatar: DEFAULT_AVATAR, // Use the constant image
      };
    }
  };

  const fetchChats = async () => {
    if (!currentUser) {
      console.warn('No current user found.');
      return;
    }

    const currentUserEmail = currentUser.email;
    const chatsRef = ref(firebase.database(), 'chats');

    try {
      setLoading(true);
      const snapshot = await get(chatsRef);

      console.log('Fetching chats data...');

      if (snapshot.exists()) {
        const chatsData = snapshot.val();
        console.log('Chats data:', chatsData);

        const userChats = [];

        for (const chatKey in chatsData) {
          const chat = chatsData[chatKey];

          if (chat.users && chat.users.includes(currentUserEmail)) {
            const otherUserId = Object.keys(chat.users).find(id => id !== userId);
            const messages = Object.values(chat.messages || {});

            if (messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              const { name: otherUserName, avatar: otherUserAvatar } = await fetchUserName(otherUserId);

              userChats.push({
                chatId: chatKey,
                otherUserId,
                lastMessage: lastMessage ? lastMessage.text : 'No messages yet',
                otherUserName,
                otherUserAvatar,
              });
            }
          }
        }

        setChats(userChats); // Update state with fetched chats
      } else {
        console.warn('No chats data available.');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching chats:', error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchChats().catch(error => {
        console.error('Error in useEffect fetching chats:', error.message);
      });
    }
  }, [currentUser]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => {
        console.log('Navigating to Message screen with chatId:', item.chatId);
        navigation.navigate('chat', { chatId: item.chatId });
      }}
    >
      <Image source={item.otherUserAvatar} style={styles.avatar} />
      <View style={styles.textContainer}>
        <Text style={styles.userName}>{item.otherUserName}</Text>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
      </View>
    </TouchableOpacity>
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
      <FlatList data={chats} keyExtractor={(item) => item.chatId} renderItem={renderItem} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 16,
    color: '#555',
  },
});

export default Myincome;
