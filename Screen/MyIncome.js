import { useNavigation } from '@react-navigation/native';
import { get, ref } from 'firebase/database';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserContext } from '../context/UserContext';
import { firebase } from '../firebase/firebaseConfig';

const Myincome = () => {
  const navigation = useNavigation();
  const { currentUser } = useContext(UserContext);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserName = async (email) => {
    if (!email) {
      console.warn('No email provided.');
      return 'Unknown User';
    }

    try {
      const usersRef = ref(firebase.database(), `driverRef`);
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();
        for (const userId in usersData) {
          if (usersData[userId].email === email) {
            const { firstName, lastName } = usersData[userId];
            return firstName && lastName ? `${firstName} ${lastName}` : 'Unknown User';
          }
        }
        return 'Unknown User';
      } else {
        return 'Unknown User';
      }
    } catch (error) {
      console.error('Error fetching user name:', error.message);
      return 'Unknown User';
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

      if (snapshot.exists()) {
        const chatsData = snapshot.val();
        const userChats = [];

        for (const chatKey in chatsData) {
          const chat = chatsData[chatKey];

          // Check if the current user (driver) is one of the users in the chat
          if (chat.users && chat.users.includes(currentUserEmail)) {
            const otherUserEmail = chat.users.find(email => email !== currentUserEmail);
            const messages = Object.values(chat.messages || {}).filter(message => message.user !== currentUserEmail);

            if (messages.length > 0) {
              const lastMessage = messages[messages.length - 1]; // Get the last message
              const senderName = await fetchUserName(otherUserEmail);

              userChats.push({
                chatId: chatKey,
                senderEmail: otherUserEmail,
                lastMessage: lastMessage ? lastMessage.text : 'No messages yet',
                senderName,
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
        navigation.navigate('chat', { chatId: item.chatId });
      }}
    >
      <Text style={styles.userName}>{item.senderName}</Text>
      <Text style={styles.lastMessage}>{item.lastMessage}</Text>
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
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
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
