import React, {Component} from 'react'
import {Platform, ScrollView, Text, TouchableOpacity, View, TextInput, Button} from 'react-native'
import RtcEngine, {RtcLocalView, RtcRemoteView, VideoRenderMode} from 'react-native-agora'

import requestCameraAndAudioPermission from './components/Permission'
import styles from './components/Style'

interface Props {
}

/**
 * @property peerIds Array for storing connected peers
 * @property appId
 * @property channelName Channel Name for the current session
 * @property joinSucceed State variable for storing success
 */
interface State {
    appId: string,
    token: string,
    channelName: string,
    joinSucceed: boolean,
    peerIds: number[],
}

export default class App extends Component<Props, State> {
    _engine?: RtcEngine

    constructor(props) {
        super(props)
        this.state = {
            appId: 'd3bedeb138554a6db3bba4ac9a476998',
            token: '006d3bedeb138554a6db3bba4ac9a476998IAAu0VqKBFzBLEE1Io5nJxpvp9pn1YLAMIdJc2DdMk2gRQJkFYoAAAAAEADGU1aHzo+3XwEAAQBkkbdf',
            channelName: 'channel-x',
            joinSucceed: false,
            peerIds: [],
        }
        if (Platform.OS === 'android') {
            // Request required permissions from Android
            requestCameraAndAudioPermission().then(() => {
                console.log('requested!')
            })
        }
    }

    componentDidMount() {
        this.init()
    }

    /**
     * @name init
     * @description Function to initialize the Rtc Engine, attach event listeners and actions
     */
    init = async () => {
        const {appId} = this.state
        this._engine = await RtcEngine.create(appId)
        await this._engine.enableAudio()

        this._engine.addListener('Warning', (warn) => {
            console.log('Warning', warn)
        })

        this._engine.addListener('Error', (err) => {
            console.log('Error', err)
        })

        this._engine.addListener('UserJoined', (uid, elapsed) => {
            console.log('UserJoined', uid, elapsed)
            // Get current peer IDs
            const {peerIds} = this.state
            // If new user
            if (peerIds.indexOf(uid) === -1) {
                this.setState({
                    // Add peer ID to state array
                    peerIds: [...peerIds, uid]
                })
            }
        })

        this._engine.addListener('UserOffline', (uid, reason) => {
            console.log('UserOffline', uid, reason)
            const {peerIds} = this.state
            this.setState({
                // Remove peer ID from state array
                peerIds: peerIds.filter(id => id !== uid)
            })
        })

        // If Local user joins RTC channel
        this._engine.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
            console.log('JoinChannelSuccess', channel, uid, elapsed)
            // Set state variable to true
            this.setState({
                joinSucceed: true
            })
        })
    }

    /**
     * @name startCall
     * @description Function to start the call
     */

    _joinChannel = async () => {
        await this._engine?.joinChannel(this.state.token, this.state.channelName, null, 0)
    }

    /**
     * @name endCall
     * @description Function to end the call
     */
    _leaveChannel = async () => {
        await this._engine?.leaveChannel()
        this.setState({peerIds: [], joinSucceed: false})
    }

    // Turn the microphone on or off.
_switchMicrophone = () => {
        const { openMicrophone } = this.state
        this._engine?.enableLocalAudio(!openMicrophone).then(() => {
            this.setState({ openMicrophone: !openMicrophone })
          }).catch((err) => {
            console.warn('enableLocalAudio', err)
          })
      }

// Switch the audio playback device.
_switchSpeakerphone = () => {
        const { enableSpeakerphone } = this.state
        this._engine?.setEnableSpeakerphone(!enableSpeakerphone).then(() => {
            this.setState({ enableSpeakerphone: !enableSpeakerphone })
          }).catch((err) => {
            console.warn('setEnableSpeakerphone', err)
          })
      }


render() {
        const {
            channelName,
            joinSucceed,
            openMicrophone,
            enableSpeakerphone,
          } = this.state;
        return (
            <View style={styles.container}>
              <View style={styles.top}>
                <TextInput
                  style={styles.input}
                  onChangeText={(text) => this.setState({ channelName: text })}
                  placeholder={'Channel Name'}
                  value={channelName}
                />
                <Button
                  onPress={joinSucceed ? this._leaveChannel : this._joinChannel}
                  title={`${joinSucceed ? 'Leave' : 'Join'} channel`}
                />
              </View>
              <View style={styles.float}>
                <Button
                  onPress={this._switchMicrophone}
                  title={`Microphone ${openMicrophone ? 'on' : 'off'}`}
                />
                <Button
                  onPress={this._switchSpeakerphone}
                  title={enableSpeakerphone ? 'Speakerphone' : 'Earpiece'}
                />
              </View>
            </View>
        )
 }


    _renderVideos = () => {
        const {joinSucceed} = this.state
        return joinSucceed ? (
            <View style={styles.fullView}>
                <RtcLocalView.SurfaceView
                    style={styles.max}
                    channelId={this.state.channelName}
                    renderMode={VideoRenderMode.Hidden}/>
                {this._renderRemoteVideos()}
            </View>
        ) : null
    }

    _renderRemoteVideos = () => {
        const {peerIds} = this.state
        return (
            <ScrollView
                style={styles.remoteContainer}
                contentContainerStyle={{paddingHorizontal: 2.5}}
                horizontal={true}>
                {peerIds.map((value, index, array) => {
                    return (
                        <RtcRemoteView.SurfaceView
                            style={styles.remote}
                            uid={value}
                            channelId={this.state.channelName}
                            renderMode={VideoRenderMode.Hidden}
                            zOrderMediaOverlay={true}/>
                    )
                })}
            </ScrollView>
        )
    }
}
