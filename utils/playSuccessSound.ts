import { Audio } from 'expo-av'

export const playSuccessSound = async () =>{
    const sound = await Audio.Sound.createAsync(
        require('../assets/sounds/success.mp3')
    )
    await sound.sound.playAsync();
}