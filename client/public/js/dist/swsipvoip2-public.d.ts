/// <reference types="node" />

import { DisconnectEvent } from 'jssip/lib/WebSocketInterface';
import { EventEmitter } from 'events';
import { IncomingRequest } from 'jssip/lib/SIPMessage';
import * as JsSIP from 'jssip';
import * as JsSIPMessage from 'jssip/lib/Message';
import * as JsSIPRTCSession from 'jssip/lib/RTCSession';
import { OutgoingRequest } from 'jssip/lib/SIPMessage';

/**
 * @public
 *
 * Class handing a SWSIPVOIP2 Call.
 *
 * @remarks About events:
 * Events raised by the call can be devided into categories and subcategories.
 * They are defined by the event type and subtype. A user can decide to subscriber to
 * an entire category, or a subset of it:
 * @example
 * ```
 * call.on('<type>', (e) => {....}); // subscribe to all '<type>' events
 * call.on('<type>:<subtype>', (e) => {....}); // subscribe to '<type>:<subtype>' only
 * ```
 */
export declare class Call extends EventEmitter {
    private static sInstanceCount;
    private mInstanceId;
    private mUa;
    private mJssipUa?;
    private mUri;
    private mCallId?;
    private mCseq;
    private mOptions;
    private mMediaHandler;
    private mNbDisconnection;
    private mStoppedReason?;
    private mFailedReason;
    private mLocalId;
    private mSessionId?;
    private mSessionType?;
    private mSessionMedia?;
    private mSessionGroupId?;
    private mSessionPriority?;
    private mGroupNames?;
    private mGroupUsersList?;
    private mGroupAddedUsers?;
    private mReceptionTime?;
    private mIsAnEmergencyCall;
    private mEmergencyInitiator?;
    private mIsABroadcastCall?;
    private mLargeGroupCount?;
    private mSwFrom?;
    private mSwFromName?;
    private mForwardedFrom?;
    private mForwardedName?;
    private mSubscriberToken?;
    private mTransferor?;
    private mMergedSessionIds?;
    private mIsOnHold;
    private mStopRequested;
    private mNumberOfReconnectionAttempts;
    private mParticipants;
    private mFloorControl;
    constructor(ua: UA, options: Call.Options);
    /**
     * Logs the provided call options
     * @param options - the call options
     */
    static logOptions: (options: Call.Options) => void;
    /**
     * @returns the reason why the call has failed. SUCCESS if the call hasn't failed
     */
    getError: () => Call.FailedReason | undefined;
    /**
     * @returns the reason why the call has stopped. undefined if the call hasn't stopped yet
     */
    getStoppedReason: () => Call.StoppedReason | undefined;
    /**
     * retrieve the current floor owner, if any
     * @returns the msisdn\@fqdn of the floor owner, or null if no one is the floor owner
     */
    getFloorOwner: () => string | undefined;
    /**
     * retrieve the current floor owner, or the previous floor owner if the floor is currently idle
     * @returns the msisdn\@fqdn of the floor owner, or null if no one took the floor, ever
     */
    getFloorOwnerLast: () => string | undefined;
    /**
     * --- BETA ---
     * retrieve the updated floor owner identity, if any
     * This is to be used when integrating with a 3GPP gateway: sometimes, those updates the identity
     * of the floor owner after the floor is granted to it. This function provides this identity, to be called after
     * {@link (FloorControl:namespace).Event.EXT_FLOOR_OWNER_USER_ID_UPDATE} event
     * @returns the updated identity of the floor owner
     */
    getFloorOwnerExtUserIdUpdated: () => string | undefined;
    /**
     * @returns the floor local state
     */
    getFloorState: () => FloorControl.State;
    /**
     * @returns the previous floor local state
     */
    getPreviousFloorState: () => FloorControl.State;
    /**
     * @returns the duration for which the floor was granted, undefined if no duration was provided
     */
    getFloorGrantedDuration: () => number | undefined;
    /**
     * @returns the floor deny reason, if any, UNKNOWN otherwise
     */
    getFloorDenyReason: () => FloorControl.DenyReason;
    /**
     * @returns the floor revoke reason, if any, UNKNOWN otherwise
     */
    getFloorRevokeReason: () => FloorControl.RevokeReason;
    /**
     * has permission to request floor? The server allows the client to request floor even though
     * there's already a floor owner (getFloorOwner() != null). Typically when the client
     * has a higher priority than the current floor owner
     * @returns true if the client can request floor, false otherwise
     */
    hasPermissionToRequestFloor: () => boolean;
    /**
     * @returns the options that were provided to the constructor
     */
    getOptions: () => Call.Options;
    /**
     * @returns the localId that was initially provided in
     * Call.options given to the constructor
     */
    getLocalId: () => string;
    /**
     * @returns the sesssion Id
     */
    getSessionId: () => string | undefined;
    /**
     * @returns the swto
     */
    getSwTo: () => string | undefined;
    /**
     * @returns the sesssion Type
     */
    getSessionType: () => Call.SessionType | undefined;
    /**
     * @returns the sesssion Media
     */
    getSessionMedia: () => Call.SessionMedia | undefined;
    /**
     * @returns the sesssion goup id
     */
    getSessionGroupId: () => string | undefined;
    /**
     * @returns true if the call is a channel
     */
    isAChannel: () => boolean;
    /**
     * @returns true if the session is large group (ie no participant event will be received)
     */
    isLargeGroup: () => boolean;
    /**
     * @returns true if the session is emergency call
     */
    isEmergencyCall: () => boolean;
    /**
     * @returns the msisdnatfqdn of the subscriber that triggered the emergency
     */
    getEmergencyInitiator: () => string | undefined;
    /**
     * @returns true if the call has an audio channel
     */
    isAudio: () => boolean;
    /**
     * @returns true if the call has a video channel
     */
    isVideo: () => boolean;
    /**
     * @returns true if the call sends and receives media
     */
    sendsAndReceives: () => boolean;
    /**
     * @returns true if the call only receives media (no send)
     */
    receivesOnly: () => boolean;
    /**
     * @returns true if the call only sends media (no receive)
     */
    sendsOnly: () => boolean;
    /**
     * Retrieves the list of participants in the session, in an hashmap that sorts the msisdn
     * according to their current state ({@link (Participant:namespace).State} for the list). If a specific state
     * is provided, only the participant in this state are returned. If ALL_PARTICIPANT is provided,
     * all known participants are returned.
     * @param state - the state for which we want to get the participants
     * @returns hashamp of Participant.State to an array of String containing the msisdn of the participants
     */
    getParticipants: (state: Participant.State | undefined) => Map<Participant.State, string[]>;
    /**
     * Retrieves the list of newly arrived participants in the session, in an hashmap that sorts the msisdn
     * according to their current state ({@link (Participant:namespace).State} for the list). If a specific state
     * is provided, only the participant in this state are returned. If ALL_PARTICIPANT is provided,
     * all known participants are returned.
     * "new" participants are participants that were never obtained through sw_participants_get,
     *  2 consecutive calls to this function with only_new set to true gets you 2 different results:
     *     - first one with all the "new" participants
     *     - second with empty lists
     * @param state - the states for which we want to get the participants
     * @returns hashamp of Participant.State to an array of String containing the msisdn of the participants
     */
    getNewParticipants: (state: Participant.State | undefined) => Map<Participant.State, string[]>;
    /**
     * --- BETA ---
     * gets an array containing the group names matching the group id this call is related to.
     * This includes groups set as destination in {@link (Call:namespace).Options.swTo}.
     * Group names are indexed by their ID.
     * @returns the group names
     */
    getGroupNames: () => string[] | undefined;
    /**
     * --- BETA ---
     * gets an array of msisdnatfqdn and groups. This is the current {@link (Call:namespace).Options.swTo}.
     * @returns the group users list
     */
    getGroupUsersList: () => string[] | undefined;
    /**
     * --- BETA ---
     * gets the list of added users after the server processed an inviteNewParticipants request
     * @returns the group added users
     */
    getGroupAddedUsers: () => string[] | undefined;
    /**
     * Gets the reception time
     * @returns the date
     */
    getReceptionTime: () => Date | undefined;
    /**
     * Retrieves the state of the participant which msisdn at fqdn is provided
     * @param msisdn - the identity of the participant (msisdn alone, or msisdn\@fqdn)
     * @returns the state, Participant.State.UNKNOWN if the subscriber could not be found
     */
    getParticipantState: (msisdn: string) => Participant.State;
    /**
     * Retrieves the previous state of the participant which msisdn at fqdn is provided
     * @param msisdn - the identity of the participant (msisdn alone, or msisdn\@fqdn)
     * @returns the state, Participant.State.UNKNOWN if the subscriber could not be found
     */
    getParticipantPreviousState: (msisdn: string) => Participant.State;
    /**
     * Retrieves the floor priority of the participant which msisdn at fqdn is provided
     * @param msisdn - the identity of the participant (msisdn alone, or msisdn\@fqdn)
     * @returns the priority, 0 if the subscriber could not be found
     */
    getParticipantFloorPriority: (msisdn: string) => number;
    /**
     * Retrieves the arrival time of the participant which msisdn at fqdn is provided
     * @param msisdn - the identity of the participant (msisdn alone, or msisdn\@fqdn)
     * @returns the arrival time, undefined if the subscriber could not be found
     */
    getParticipantArrivalTime: (msisdn: string) => Date | undefined;
    /**
     * --- BETA ---
     * Retrieves the video capture source of the participant which msisdn at fqdn is provided
     * @param msisdn - the identity of the participant (msisdn alone, or msisdn\@fqdn)
     * @returns the video capture source, undefined if the subscriber could not be found
     */
    getParticipantVideoCaptureSource: (msisdn: string) => Participant.VideoCaptureSource | undefined;
    /**
     * Retrieves the msisdn at fqdn of the last updated participant
     * @returns the identity of the last updated participant
     */
    getLastUpdatedParticipant: () => string | undefined;
    /**
     * Checks if the provided participant is from an interas regroup
     * @param contact - the identity of the participant
     * @returns true if the subscriber is from interas regroup
     */
    isParticipantFromInterASRegroup: (contact: string) => boolean;
    /**
     * Retrieves the msisdn at fqdn of the transferor
     * @returns the identity of the transferor
     */
    getTransferor: () => string | undefined;
    /**
     * --- BETA ---
     * Retrieves the Ids of the merge session, if any
     * @returns the merged session ids
     */
    getMergedSessionIds: () => string | undefined;
    /**
     * Sets the rendering elements used by the Call to play local and remote streams
     * @param options - the Play options
     * @returns true if everything went well, false otherwise
     */
    setPlayOptions: (options: MediaHandler.PlayOptions) => boolean;
    /**
     * --- BETA ---
     * @returns the value of the current local volume, in dB range [-127, 0]
     */
    getMediaVolumeLocal: () => number;
    /**
     * --- BETA ---
     * @returns the value of the current remote volume, in dB range [-127, 0]
     */
    getMediaVolumeRemote: () => number;
    /**
     * --- BETA ---
     * @returns Blob containing the last local record
     */
    getRecordLocal: () => Blob | undefined;
    /**
     * --- BETA ---
     * @returns the duration of the last local record, in ms
     */
    getRecordDurationLocal: () => number | undefined;
    /**
     * --- BETA ---
     * @returns Blob containing the last remote record
     */
    getRecordRemote: () => Blob | undefined;
    /**
     * --- BETA ---
     * @returns the duration of the last remote record, in ms
     */
    getRecordDurationRemote: () => number | undefined;
    /**
     * --- BETA ---
     * @returns an integer which possible values are:
     *    - 5: very good: no network problem. - clear sound
     *    - 4: good: a little of packet loss and/or little jitter - ok sound, but could be better
     *    - 3: medium: more packet loss and/or jitter - distortions and/or small gaps.
     *    - 2: bad: strong packet loss and/or jitter - heavy distortions and/or big gapes
     *    - 1: very bad: the stack fails to receive reports from the remote participant - no sound
     *    - 0: N/A: not supposed to get an indicator
     */
    getMediaQos: () => number;
    /**
     * --- BETA ---
     * Opens a popup, showing the states of up and down streams
     * @remarks
     * this should be used for debug only, or as an easter egg ;)
     */
    openMediaStatsWindow: () => void;
    /**
     * --- BETA ---
     * Set the audio to be played on one of the following
     * @param c - the audio channel
     */
    setAudioPlayChannel: (c: MediaHandler.Panning) => void;
    /**
     * Starts the call
     *
     * What this function does:
     * - get a subscriber token if the a promise was provided to {@link (Call:namespace).Options}.
     * - get a mediastream if needed, according to the parameters in {@link (Call:namespace).Options}
     * - sends an SIP INVITE. Upon reception of a response, the event {@link (Call:namespace).Event.STARTED}
     *   is raised if everything went fine, {@link (Call:namespace).Event.FAILED} otherwise.
     *   Check {@link (Call:class).getError} to know why
     */
    start: () => void;
    /**
     * Stops the call
     *
     * The call is actually ended when the event {@link (Call:namespace).Event.STOPPED} is raised
     */
    stop: () => boolean;
    /**
     * @returns an MediaOptions object containing which component is muted
     * if the call is currently muted (ie sends no media)
     * Note it returns true if the call is onhold
     */
    isMuted: () => MediaHandler.MediaOptions;
    /**
     * Makes the call mute itself: send no more media
     * Note this has no effect if the call is already onhold
     * @param options - an MediaOptions object containing which component to mute
     * @returns true if the call managed to mute itself
     */
    mute: (options: MediaHandler.MediaOptions) => boolean;
    /**
     * Makes the call unmute itself: send media
     * Note this has no effect if the call is already onhold
     * @param options - an MediaOptions object containing which component to unmute
     * @returns true if the call managed to unmute itself
     */
    unmute: (options: MediaHandler.MediaOptions) => boolean;
    /**
     * @returns an MediaOptions object containing which component is muted
     * if the call currently muted play (ie plays no media)
     */
    isPlayMuted: () => MediaHandler.MediaOptions;
    /**
     * Makes the call mute itself: stop playing media
     * Note this has no effect if the call is already onhold
     * @param options - an MediaOptions object containing which component to mute
     * @returns true if the call managed to mute play
     */
    mutePlay: (options: MediaHandler.MediaOptions) => boolean;
    /**
     * Makes the call unmute itself: resume playing media
     * Note this has no effect if the call is already onhold
     * @param options - an MediaOptions object containing which component to unmute
     * @returns true if the call managed to unmute play
     */
    unmutePlay: (options: MediaHandler.MediaOptions) => boolean;
    /**
     * --- BETA ---
     * sets the volume of the played audio, if any. This function has
     * no effects on video only calls.
     * Note that
     *  * @example
     * ```
     * setPlayVolume(0)
     * ```
     * should have the same functional result as
     * ```
     * mutePlay({audio: true})
     * ```
     * however, they are implemented differently:
     * the former sets the volume of the HTML element that was initially
     * provided in PlayOptions, while the former actually disable the track
     * of the RTCPeerConnection receiver.
     * @param volume - the volume value, possible range: [0 1]
     * @returns true if the volume could be set, false otherwise
     */
    setPlayVolume: (volume: number) => boolean;
    /**
     * whether or not the call is on hold
     * @returns true if the call is on hold, false otherwise
     */
    isOnHold: () => boolean;
    /**
     * whether or not the other participants are on hold
     * @returns true if all the other participants are currently on hold
     */
    areOthersOnHold: () => boolean;
    /**
     * mute both speakers and mics: the call sends no more media nor plays any incoming stream
     * the client sends a request to the server so all other participants are aware it is on hold
     * @returns true if it manages to go on hold
     */
    putOnHold: () => boolean;
    /**
     * unmute both speakers and mics: the call sends media and plays any incoming stream
     * the client sends a request to the server so all other participants are aware it resumed the call
     * @returns true if it manages to resume
     */
    resume: () => boolean;
    /**
     * make the call invite new participants (subscribers or groups)
     * @param swto - contains the list of invited subscribers/groups, all separated by a comma:
     *                - subscribers: "msisdn\@fqdn"
     *                - groups: groupId:"groupId"
     *                - example; 1111111111\@1.2.3.4,1111112222\@1.2.3.4,group:1
     * @param swout - contains the list of invited callees, all separated by a comma:
     *                - subscribers: "msisdn"
     *                - example; 33100000001,33100000002
     * @param newSessionGroupId - contains the new session group id. This new session group id will be pushed
     *                          to all participants along with the newly invited participants
     *                          if the invitation goes through
     * @returns true if it managed to send the invitation
     */
    inviteNewParticipants: (newSwto: string | undefined, newSwout: string | undefined, newSessionGroupId: string | undefined) => boolean;
    /**
     * make the stack transfer the call to a target participant
     * @param swto - contain the target "msisdn\@fqdn"
     * @param swout - contains the target "msisdn"
     * @returns true if it managed to send the invitation
     */
    transfer: (swto: string | undefined, swout: string | undefined) => boolean;
    /**
     * make the stack update the call
     * @param updateParameters - the update parameters
     * @returns true if it managed to send the update
     */
    update: (updateParameters: Call.UpdateOptions) => boolean;
    /**
     * --- BETA ---
     * Kicks the participants in swTo. Only participants invited by the caller can be kicked.
     *
     * @param swTo - The list of callees to kick. This is a list of MSISDN\@FQDN and group:id separated by commas.
     * @returns true if everything went fine
     */
    kickInvitedParticipants: (swTo: string) => boolean;
    /**
     * send a participant list request. The caller has to wait for
     * the {@link (Participant:namespace).Event.PARTICIPANT_LIST} event
     * to actually get the participant list
     * @returns true if it manages to send the participant list
     */
    requestParticipantList: () => boolean;
    /**
     * Enqueues a Floor Request: claim the floor in PoC sessions
     * @returns true if the call managed to sends the request, false otherwise
     */
    requestFloor: () => boolean;
    /**
     * Enqueues a Floor Release: release the floor in PoC sessions once it has been seized
     * @returns true if the call managed to sends the request, false otherwise
     */
    releaseFloor: () => boolean;
    /*
     * --- BETA ---
     */
    enqueueDtmf: (dtmf: string) => boolean;
    /**
     * @returns a Human readable version of the call instance
     */
    toString: () => string;
    private newEvent;
    private isWalkieTalkie;
    private onNewRtcSession;
    private onAccepted;
    private onEnded;
    private onFailed;
    private stopJssipUa;
    private getInviteExtraHeaders;
    private parseheaders;
    private onMessageOutgoingRequest;
    private onMessage;
    private onServiceMessage;
    private onServiceMessageParticipantList;
    private sendServiceMessage;
    private received500Error;
}

/**
 * @public
 */
export declare namespace Call {


    export interface Options {
        /**
         * The subscriber's MSISDN.
         */
        subscriberMsisdn: string;
        /**
         * The subscriber's password. It will be ignored if {@link (Call:namespace).Options.getSubscriberToken} is set
         */
        subscriberPassword?: string;
        /**
         * A Promise that fetches a token for the subscriber.
         */
        getSubscriberToken?: () => Promise<string>;
        /**
         * (default: null)
         * The list of callees. This is a list of MSISDN\@FQDN and group:id separated by commas.
         * Those can be provided in parallel of {@link (Call:namespace).Options.swOut}
         * example:
         * - "33100000001\@192.168.19.43"
         * - "33100000001\@192.168.19.43,33100000002\@192.168.19.43"
         * - "group:1"
         * - "group:1,group:5"
         * - "33100000001\@192.168.19.43,33100000002\@192.168.19.43,group:1"
         * - "group:2,33100000001\@192.168.19.43,33100000002\@192.168.19.43,group:1"
         */
        swTo?: string;
        /**
         * --- BETA ---
         * (default: null)
         * the list of callees out of Agnet. Those can be provided in parallel of {@link (Call:namespace).Options.swTo}
         */
        swOut?: string;
        /**
         * --- BETA ---
         * (default: false) For call outs: Whether the call is anonymous or not
         */
        isAnonymous?: boolean;
        /**
         * the session id the caller wants this session to connect to, if any. This field is required
         * to be set by the caller when the caller wants the clients to connect to a specific session.
         */
        sessionId?: string;
        /**
         * the session type
         */
        sessionType: SessionType;
        /**
         * (default: SipPriority.NORMAL) the session priority
         */
        sessionSipPriority?: SipPriority;
        /**
         * the session media
         */
        sessionMedia: SessionMedia;
        /**
         * (default: null) the session Group Id is an identifier to bind this call session to a messaging conversation
         */
        sessionGroupId?: string;
        /**
         * (default: null) the localId can be use to associate the call to an id chosen by the caller
         */
        localId?: string;
        /**
         * --- BETA ---
         * (default: false) The call tries to automatically reconnect in case of abrupt disconnection or network error
         */
        autoReconnect?: boolean;
        /**
         * --- BETA ---
         * (default: false) If this call is to be synchronized with the other devices (webchat)
         */
        synchronizeWithOtherDevices?: boolean;
        /**
         * (default: false) If the call is an emergency call
         */
        isEmergencyCall?: boolean;
        /**
         * --- BETA ---
         * (default: false) If the call is a broadcast call
         */
        isBroadcastCall?: boolean;
        /**
         * (default: false) If the call is for recipients marked as available
         */
        availableOnlyRecipients?: boolean;
        /**
         * (default: false) Makes the call request the floor when sending the initial INVITE
         */
        floorRequestOnInvite?: boolean;
        /**
         * --- BETA ---
         * (default: null) the comma seperated list of session id this session is merged of
         */
        mergedSessionIds?: string;
        /**
         * --- BETA ---
         * (default: null)
         * The caller may provide its own mediaStream; if so, the mediastream will NOT be destroyed
         * at the end of the call
         * if no mediastream is provided, a new mediastream will be requested from the user by the call
         */
        mediaStream?: MediaStream;
        /**
         * --- BETA ---
         * (default: null)
         * the Media capture options
         * Those are ignored if {@link (Call:namespace).Options.mediaStream} is included
         */
        captureOptions?: MediaHandler.CaptureOptions;
        /**
         * the Media capture options
         */
        playOptions: MediaHandler.PlayOptions;
    }
    export interface UpdateOptions {
        /**
         * If the call is an emergency call. If omitted, emergency call is left "as-is"
         */
        isEmergencyCall?: boolean;
        /**
         * (default: false)
         * If isEmergencyCall and isAutomaticFloorRequest are set to true, floor request is sent upon update
         */
        isAutomaticFloorRequest?: boolean;
    }
    export interface CEvent {
        /**
         * The event type
         */
        type: Call.Event;
        /**
         * The event subtype, if any
         */
        subtype?: FloorControl.Event | Participant.Event | MediaHandler.Event;
        /**
         * The Call this event is bound to
         */
        call: Call;
    }
    export enum Event {
        /**
         * The call has been successfully started (INVITE + 200 OK, this event can be raised several times)
         */
        STARTED = "Started",
        /**
         * The call has been been stopped. The reason for that is available with {@link (Call:class).getStoppedReason}
         */
        STOPPED = "Stopped",
        /**
         * The call has failed. The reason for that is available with {@link (Call:class).getError}
         */
        FAILED = "Failed",
        /**
         * The Call has been disconnected because a disconnection occured, it is currently tryin to reconnect
         */
        DISCONNECTED_AND_RECONNECTING = "disconnected_and_reconnecting",
        /**
         * the call to {@link (Call:class).inviteNewParticipants} has been successful
         */
        SESSION_SUBSCRIBER_INVITATION_OK = "invite_new_participants_ok",
        /**
         * the call to {@link (Call:class).inviteNewParticipants} has failed. See
         * {@link (Call:class).getError} to get the reason why.
         */
        SESSION_SUBSCRIBER_INVITATION_NOK = "invite_new_participants_nok",
        /**
         * the call to {@link (Call:class).transfer} has been successful
         */
        SESSION_TRANSFER_OK = "transfer_ok",
        /**
         * the call to {@link (Call:class).transfer} has failed. See
         * {@link (Call:class).getError} to get the reason why.
         */
        SESSION_TRANSFER_NOK = "transfer_nok",
        /**
         * the call to {@link (Call:class).update} has been successful
         */
        SESSION_UPDATE_OK = "update_ok",
        /**
         * the call to {@link (Call:class).update} has failed. See
         * {@link (Call:class).getError} to get the reason why.
         */
        SESSION_UPDATE_NOK = "update_nok",
        /**
         * the session has been updated
         */
        SESSION_UPDATED = "updated",
        /**
         * The call participant list has been updated.
         */
        PARTICIPANT = "Participant",
        /**
         * The call internal floor control state has been updated.
         */
        FLOOR_CONTROL = "FloorControl",
        /**
         * The call media has been updated.
         */
        MEDIA = "Media"
    }
    export enum SessionMedia {
        /**
         * placeholder
         */
        UNKNOWN = "unknown",
        /**
         * Audio only
         */
        AUDIO = "audio",
        /**
         * Video only
         */
        VIDEO = "video",
        /**
         * Audio and Video
         */
        AUDIOVIDEO = "audiovideo"
    }
    /**
     * The session call type.
     */
    export enum SessionType {
        /**
         * placeholder
         */
        UNKNOWN = "unknown",
        /**
         * a one to one full duplex call session without floor control
         */
        FREECALL = "live",
        /**
         * a half duplex call session (sender or receiver only)
         */
        WALKIETALKIE = "PoC",
        /**
         * a half duplex call session (sender or receiver only)
         */
        LIVESTREAM = "livestream",
        /**
         * --- BETA ---
         * a one to many full duplex call session without floor control
         */
        CONFERENCE = "conference",
        /**
         * --- BETA ---
         * a half duplex call session without floor control
         */
        AMBIENT_LISTENING = "ambient-listening"
    }
    /**
     * The session priority.
     */
    export enum SipPriority {
        /**
         * non urgent
         */
        NON_URGENT = "non-urgent",
        /**
         * normal
         */
        NORMAL = "normal",
        /**
         * urgent
         */
        URGENT = "urgent",
        /**
         * emergency
         */
        EMERGENCY = "emergency"
    }
    export enum Hangup {


    }
    /**
     * The reason why the call has stopped. Note that no reconnection is expected.
     */
    export enum StoppedReason {
        STOPPED_UNKNOWN = "unknown",
        /**
         * The call has been cancelled.
         */
        STOPPED_CANCELLED = "cancelled",
        /**
         * The call has been disconnected.
         */
        STOPPED_DISCONNECTION = "disconnection",
        /**
         * The call has ended after a BYE was sent.
         */
        STOPPED_BYE_SENT = "bye_sent",
        /**
         * The call has ended after a BYE was received without any reason.
         */
        STOPPED_BYE_RECEIVED = "bye_received",
        /**
         * The call was ended by the server as the subscriber isn't allowed anymore in the session
         */
        STOPPED_BYE_RECEIVED_NOT_ALLOWED = "bye_received_not_allowed",
        /**
         * The call was ended by the server as the subscriber has joined the session with an other device/browser.
         */
        STOPPED_BYE_RECEIVED_CALL_REPLACED = "bye_received_call_replaced",
        /**
         * The call was ended by the server as the initiator of the session left.
         */
        STOPPED_BYE_RECEIVED_INITIATOR_LEFT = "bye_received_initiator_left",
        /**
         * The call was ended by the server as the subscriber was removed from the group
         */
        STOPPED_BYE_RECEIVED_GROUP_REMOVED = "bye_received_group_received",
        /**
         * The call was ended by the server because nothing happened for a while
         */
        STOPPED_BYE_RECEIVED_HANG_TIME = "bye_received_hang_time",
        /**
         * The call was ended by the server because a subscriber terminated the call
         */
        STOPPED_BYE_RECEIVED_TERMINATED = "bye_received_terminated",
        /**
         * The call has ended because all autoreconnection attempts has failed.
         */
        STOPPED_AUTORECONNECTION_TIMEOUT = "autoreconnection_timeout",
        /**
         * The call has ended because the subscriber stopped sharing
         */
        STOPPED_SHARING_LOCAL_MEDIA = "stopped_sharing_local_media"
    }
    /**
     * The reason why the call has failed.
     */
    export enum FailedReason {
        SUCCESS = "SUCCESS",
        /**
         * Trying to join a call with a non existing account
         */
        ACCOUNT_NOT_EXIST = "ACCOUNT_NOT_EXIST",
        /**
         * Bad password or token
         */
        AUTH_BAD_PASSWORD = "AUTH_BAD_PASSWORD",
        /**
         * The MSISDN is not authorized for requested action
         */
        UNAUTHORIZED_MSISDN = "UNAUTHORIZED_MSISDN",
        /**
         * Subscriber has been blocked
         */
        SUBSCRIBER_BLOCKED = "SUBSCRIBER_BLOCKED",
        /**
         * Subscriber has been disabled
         */
        SUBSCRIBER_DISABLED = "SUBSCRIBER_DISABLED",
        /**
         * Subscriber has been unassigned
         */
        SUBSCRIBER_UNASSIGNED = "SUBSCRIBER_UNASSIGNED",
        /**
         * Subscriber's organization has been blocked
         */
        ORGANIZATION_BLOCKED = "ORGANIZATION_BLOCKED",
        /**
         * Subscriber's organization credentials is expired
         */
        ORGANIZATION_EXPIRED = "ORGANIZATION_EXPIRED",
        /**
         * Call out has failed
         */
        CALL_OUT_FAILED = "CALL_OUT_FAILED",
        /**
         * Call out failed because callee is already on the line
         */
        CALL_OUT_BUSY = "CALL_OUT_BUSY",
        /**
         * Trying to join a call that does not exists
         */
        UNKNOWN_SESSION_ID = "UNKNOWN_SESSION_ID",
        /**
         * Service is currently unavailable
         */
        SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
        /**
         * Subscriber is not allowed to make the call as the feature is not allowed
         */
        FEATURE_NOT_ALLOWED = "FEATURE_NOT_ALLOWED",
        /**
         * Subscriber is not authorized to make the call
         */
        CUG_DENIED = "CUG_DENIED",
        /**
         * No resource is currently available to make the call
         */
        NO_RESOURCE = "NO_RESOURCE",
        /**
         * Channel is full
         */
        CHANNEL_FULL = "CHANNEL_FULL",
        /**
         * SDP negociation has failed, or SDP is missing
         */
        MISSING_SDP = "MISSING_SDP",
        /**
         * The sent INVITE has been rejected by the backend as it is considered as invalid
         */
        INVALID_INVITE = "INVALID_INVITE",
        /**
         * The server VoIP application has failed
         */
        INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
        /**
         * The client has sent too many INVITES
         */
        INCOMING_SIP_INVITES_LIMIT_REACHED = "INCOMING_SIP_INVITES_LIMIT_REACHED",
        /**
         * The client has sent too many MESSAGES
         */
        INCOMING_SIP_MESSAGES_LIMIT_REACHED = "INCOMING_SIP_MESSAGES_LIMIT_REACHED",
        /**
         * The client has failed to authenticate too many times
         */
        FAILED_AUTHENTICATION_LIMIT_REACHED = "FAILED_AUTHENTICATION_LIMIT_REACHED",
        /**
         * The client has been rejected because too many participants are in the session
         */
        TOO_MANY_PARTICIPANTS = "TOO_MANY_PARTICIPANTS",
        /**
         * The call to {@link (Call:namespace).Options.getSubscriberToken} has failed
         */
        COULD_NOT_GET_TOKEN = "COULD_NOT_GET_TOKEN",
        /**
         * The call could not get a mediastream preliminary to start the call
         */
        COULD_NOT_GET_MEDIASTREAM = "COULD_NOT_GET_MEDIASTREAM",
        /**
         * The call could not BE ESTABLISHED
         */
        CONNECTION_ERROR = "CONNECTION_ERROR"
    }
}

/** @public */
export declare class Configuration {
    /**
     * Configure the js, using the client.json file
     *
     * @param cnfs - a dictionnary of key: value
     */
    static setGlobalConfiguration: (cnfs: {
        [key: string]: string;
    }) => void;
}

/** @public */
export declare const disableLog: () => void;

/** @public */
export declare const enableLog: (str?: string | undefined) => void;

/** @public */
export declare class FloorControl {
    sendmessage: (options: JsSIPMessage.SendMessageOptions) => void;
    onevent: (fev: FloorControl.Event) => void;
    mute: (doMute: boolean) => void;
    private mSubscriberMsisdn;
    private mFloorOwner?;
    private mFloorOwnerExtUserIdUpdated?;
    private mFloorOwnerLast?;
    private mFloorStateCurrent;
    private mFloorStatePrevious;
    private mFloorGrantedDuration?;
    private mFloorDenyReason;
    private mFloorRevokeReason;
    private mFloorHasPermissionToRequestFloor;
    private mParticipants;
    constructor(msisdn: string, participants: Participants);
    getFloorOwner: () => string | undefined;
    getFloorOwnerLast: () => string | undefined;
    getFloorOwnerExtUserIdUpdated: () => string | undefined;
    getFloorState: () => FloorControl.State;
    getPreviousFloorState: () => FloorControl.State;
    getFloorGrantedDuration: () => number | undefined;
    getFloorDenyReason: () => FloorControl.DenyReason;
    getFloorRevokeReason: () => FloorControl.RevokeReason;
    hasPermissionToRequestFloor: () => boolean;
    updateFloorOwner: (str: string) => void;
    updateFloorControlState: (newState: FloorControl.State) => void;
    /**
     * Enqueues a Floor Request: claim the floor in PoC sessions
     * @returns true if the stack managed to sends the request, false otherwise
     */
    requestFloor: () => boolean;
    /**
     * Enqueues a Floor Release: release the floor in PoC sessions once it has been seized
     * @returns true if the stack managed to sends the request, false otherwise
     */
    releaseFloor: () => boolean;
    onMediaburstMessage: (fev: FloorControl.Event, request: IncomingRequest | OutgoingRequest) => boolean;
}

/** @public */
export declare namespace FloorControl {
    export enum State {
        /**
         * initial state
         */
        START_STOP = "StartStop",
        /**
         * the client has no permission, and did not request the floor
         */
        HAS_NO_PERMISSION = "HasNoPermission",
        /**
         * the client has no permission, and did send a floor request
         */
        PENDING_REQUEST = "PendingRequest",
        /**
         * the client has the floor
         */
        HAS_PERMISSION = "HasPermission",
        /**
         * the client has the floor, and did send a floor release
         */
        PENDING_RELEASE = "PendingRelease",
        /**
         * the client floor control is inactive, for one of the following reasons:
         * - the call is reconnecting
         * - the client is alone in the call
         * - the call is stopping
         * - the call is on hold (either the client, or all the other participant are on hold)
         */
        INACTIVE = "Inactive"
    }
    export enum Event {
        /**
         * a floor request has been sent, the local floor state is now PENDING_REQUEST.
         */
        REQUEST = "MediaBurstRequest",
        /**
         * a floor release has been sent, the local floor state is now PENDING_RELEASE.
         */
        RELEASE = "MediaBurstRelease",
        /**
         * the floor is now free to take, the local floor state is now HAS_NO_PERMISSION.
         */
        IDLE = "MediaBurstIdle",
        /**
         * the floor has been taken on the server, the local floor state is unchanged.
         */
        TAKEN = "MediaBurstTaken",
        /**
         * the floor has been granted, the local floor state is now HAS_PERMISSION.
         */
        GRANTED = "MediaBurstGranted",
        /**
         * the floor request has timed out and failed, the local floor state is unchanged.
         */
        REQUEST_TIMEOUT = "MediaBurstRequestTimeout",
        /**
         * the floor request has been denied, the local floor state returns to HAS_NO_PERMISSION.
         */
        DENY = "MediaBurstDeny",
        /**
         * the floor has been revoked, the local floor state is now HAS_NO_PERMISSION.
         */
        REVOKE = "MediaBurstRevoke",
        /**
         * the floor release has timed out and failed, the local floor state is unchanged.
         */
        RELEASE_TIMEOUT = "MediaBurstReleaseTimeout",
        /**
         * the floor request has been queued, the local floor state is unchanged.
         */
        QUEUED = "MediaBurstQueued",
        /**
         * The floor owner user id has been updated
         */
        EXT_FLOOR_OWNER_USER_ID_UPDATE = "MediaBurstExtFloorOwnerUserIdUpdate",
        /**
         * The floor is now ready to be taken
         */
        READY_TO_TRANSMIT = "ReadyToTransmit"
    }
    export enum DenyReason {
        /**
         * An other client has permission
         */
        ANOTHER_CLIENT_HAS_PERMISSION = "BURST_DENIED_ANOTHER_CLIENT_HAS_PERMISSION",
        /**
         * Internal server error
         */
        INTERNAL_SERVER_ERROR = "BURST_DENIED_INTERNAL_SERVER_ERROR",
        /**
         * Participant is alone
         */
        ONLY_ONE_PARTICIPANT = "BURST_DENIED_ONLY_ONE_PARTICIPANT",
        /**
         * Timer T9 (Retry-after) has not expired after permission to send media has been revoked
         */
        RETRY_AFTER_TIMER_NOT_EXPIRED = "BURST_DENIED_RETRY_AFTER_TIMER_NOT_EXPIRED",
        /**
         * The participant can only receive media stream
         */
        RECEIVE_ONLY = "BURST_DENIED_RECEIVE_ONLY",
        /**
         * There's no available resource for the participant to take the floor
         */
        NO_RESOURCES = "BURST_DENIED_NO_RESOURCES",
        /**
         * The request queue is full
         */
        QUEUE_FULL = "BURST_DENIED_QUEUE_FULL",
        /**
         * Any other reason
         */
        OTHER = "BURST_DENIED_OTHER",
        /**
         * Placeholder
         */
        UNKNOWN = "BURST_DENIED_UNKNOWN"
    }
    export enum RevokeReason {
        /**
         * Participant is now alone (probably after a participant left)
         */
        ONLY_ONE_PARTICIPANT = "OnlyOneParticipant",
        /**
         * The participant took the floor for longer than the granted duration
         */
        MEDIABURST_TOO_LONG = "MediaburstTooLong",
        /**
         * The participant has no permission
         */
        NO_PERMISSION = "NoPermission",
        /**
         * The participant has been preempted by an other participant
         */
        PREEMPTED = "Preempted",
        /**
         * There's no resource left
         */
        NO_RESOURCES = "NoResources",
        /**
         * Any other reason
         */
        OTHER = "Other",
        /**
         * Placeholder
         */
        UNKNOWN = "Unknown"
    }
}

export { JsSIP }

/** @public */
export declare namespace MediaHandler {
    export interface MediaOptions {
        audio?: boolean;
        video?: boolean;
    }
    /*
     * --- BETA ---
     */
    export interface CaptureOptions {
        /**
         * the HTML element that can be used as a source for the call.
         */
        htmlSource?: HTMLCanvasElement;
        /**
         * If set and set to true, then the mediastream to use is the screen sharing
         */
        screensharing?: boolean;
        /**
         * If set to true, then captured mediaburst is recorded
         */
        shouldRecord?: boolean;
    }
    export interface PlayOptions {
        /**
         * The element used to render the remote stream
         */
        rendererRemote?: HTMLMediaElement;
        /**
         * The element used to render the local stream (feedback)
         */
        rendererLocal?: HTMLMediaElement;
        /**
         * --- BETA ---
         * If set to true, then captured mediaburst is played
         */
        shouldRecord?: boolean;
    }
    /*
     * --- BETA ---
     */
    export enum Event {
        /**
         * a new value for the local volume has been computed
         */
        VOLUME_LOCAL = "volumeLocal",
        /**
         * a new value for the remote volume has been computed
         */
        VOLUME_REMOTE = "volumeRemote",
        /**
         * a New QOS indicator has been computed, {@link (Call:class).getMediaQos}
         */
        QOS = "qos",
        /**
         * a track from the provided local media stream has ended (user stopped sharing)
         */
        MEDIA_STREAM_LOCAL_TRACK_ENDED = "mediaStreamLocalTrackEnded",
        /**
         * A change in input device list has been detected
         */
        MEDIA_STREAM_DEVICE_CHANGE = "mediaStreamDeviceChange",
        /**
         * a burst has been received and recorded
         */
        BURST_RECORDED_RECEIVED = "burstRecordedReceived",
        /**
         * a burst has been sent and recorded
         */
        BURST_RECORDED_SENT = "burstRecordedSent"
    }
    /*
     * --- BETA ---
     */
    export enum Panning {
        /**
         * Audio is not modified, and is played in both ears
         */
        CENTER = 0,
        /**
         * Audio is left ear only
         */
        LEFT = -1,
        /**
         * Audio is right ear only
         */
        RIGHT = 1
    }
}

/** @public */
declare const name_2 = "SWSIPVOIP2";
export { name_2 as name }

/** @public */
export declare namespace Participant {

    export enum Event {
        /**
         * An up to date participant list has been received, {@link (Call:class).getParticipants} to get it
         */
        PARTICIPANT_LIST = "ParticipantList",
        /**
         * New participants have been invited, {@link (Call:class).getNewParticipants} to get the newest list
         */
        PARTICIPANT_INVITED = "ParticipantInvited",
        /**
         * A participant has been reached, {@link (Call:class).getLastUpdatedParticipant} to find out which
         */
        PARTICIPANT_REACHED = "ParticipantReached",
        /**
         * A participant joined, {@link (Call:class).getLastUpdatedParticipant} to find out which
         */
        PARTICIPANT_JOINED = "ParticipantJoined",
        /**
         * A participant left, {@link (Call:class).getLastUpdatedParticipant} to find out which
         */
        PARTICIPANT_LEFT = "ParticipantLeft",
        /**
         * A participant refused to join the session, {@link (Call:class).getLastUpdatedParticipant} to find out which
         */
        PARTICIPANT_REFUSED = "ParticipantRefused",
        /**
         * A participant is now on hold, {@link (Call:class).getLastUpdatedParticipant} to find out which
         */
        PARTICIPANT_ONHOLD = "ParticipantOnHold",
        /**
         * A participant has resumed the call, {@link (Call:class).getLastUpdatedParticipant} to find out which
         */
        PARTICIPANT_RESUME = "ParticipantResume",
        /**
         * A participant is transfering the call, {@link (Call:class).getTransferor} to find out which
         */
        PARTICIPANT_TRANSFER = "ParticipantTransfer"
    }

    export enum RefusedReason {
        UNANSWERING = "UNANSWERING",
        DECLINED = "DECLINED",
        BUSY = "BUSY"
    }
    export enum State {
        /**
         * unknown
         */
        UNKNOWN = "UNKNOWN",
        /**
         * The participant is created on the server
         */
        CREATED = "CREATED",
        /**
         * the participant has been invited to join the session
         */
        INVITED = "INVITED",
        /**
         * The participant has been reached on the server
         */
        REACHED = "REACHED",
        /**
         * the participant is currently attending to the session
         */
        ATTENDING = "ATTENDING",
        /**
         * the participant is currently attending to the session and is on hold
         */
        ATTENDING_ONHOLD = "ATTENDING_ONHOLD",
        /**
         * the participant is currently reconnecting to the session
         */
        RECONNECTING = "RECONNECTING",
        /**
         * the participant hung up on the call
         */
        HUNGUP = "HUNGUP",
        /**
         * The participant did not answer to the invitation
         */
        UNANSWERING = "UNANSWERING",
        /**
         * the participant declined
         */
        DECLINED = "DECLINED",
        /**
         * the participant is currently busy
         */
        BUSY = "BUSY",
        /**
         * the participant does not have the feature
         */
        FEATURE_NOT_ALLOWED = "FEATURE_NOT_ALLOWED",
        /**
         * the CUG denied to call this participant
         */
        CUG_DENIED = "CUG_DENIED",
        /**
         * ALL
         */
        ALL_PARTICIPANT = "All"
    }
    /**
     * --- BETA ---
     * The Video Capture Source, if any
     */
    export enum VideoCaptureSource {
        /**
         * the source is a regular camera
         */
        CAMERA = "camera",
        /**
         * the source is an external camera
         */
        CAMERA_EXTERNAL = "camera_external",
        /**
         * the source is a screen sharing
         */
        SCREEN_SHARING = "screen_sharing",
        /**
         * the source is a canvas
         */
        CANVAS = "canvas",
        /**
         * the source is a file
         */
        FILE = "file",
        DEFAULT = "camera"
    }
}

/** @public */
export declare namespace UA {
    export interface Options {
        /**
         * The ordered list of comma separated hosts the UA should try to connect to.
         * Once connected to a server of the list, it doesn't try the other hosts until the next reconnection attempt.
         */
        host: string;
        /**
         * The ordered list of comma separated ports the UA should try to connect to.
         * Once connected to a port of the list, it doesn't try the other ports until the next reconnection attempt.
         * Note the UA iterates first through the hosts, then for each hosts, will try the ports.
         */
        port: string;
    }
}

/**
 * @public
 *
 * Class creating a SWSIPVOIP User Agent.
 */
export declare class UA extends EventEmitter {
    private static sInstanceCount;
    private mInstanceId;
    private mOptions;
    private mSocket;
    private mCalls;
    private mIsConnectionTimeout;
    /**
     * @param options - the UA options
     */
    constructor(options: UA.Options);
    /**
     * @param options - the call options to generate a new Call. Note this call is bound to this UA.
     * @returns the newly created call. The call may be started using the {@link (Call:class).start} function.
     */
    newCall: (options: Call.Options) => Call;





    toString: () => string;


}

/**
 * @public
 */
export declare namespace UA {

}

/** @public */
export declare const version = "2.0.101247";

export { }
