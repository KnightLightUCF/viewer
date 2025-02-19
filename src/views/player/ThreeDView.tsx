/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import config from 'config';

import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import '~/aframe';

import { objectToString } from '@skybrush/aframe-components';
import type {
  ThreeJsPosition,
  ThreeJsRotation,
} from '@skybrush/aframe-components/lib/spatial';

import {
  getEffectiveScenery,
  getPreferredDroneRadius,
} from '~/features/three-d/selectors';
import {
  getInitialCameraConfigurationOfShow,
  getLoadedShowId,
  getNumberOfDronesInShow,
  isShowIndoor,
} from '~/features/show/selectors';
import type { RootState } from '~/store';

import CoordinateSystemAxes from './CoordinateSystemAxes';
import Scenery from './Scenery';
import type { SceneryType } from './Scenery';

import glow from '~/../assets/img/sphere-glow-hollow.png';
// const flapperDrone = require('~/../assets/models/flapper-drone.obj').default;

type ThreeDViewProps = {
  readonly axes: boolean;
  readonly cameraConfiguration: {
    position: ThreeJsPosition;
    rotation: ThreeJsRotation;
  };
  readonly cameraRef: React.RefObject<HTMLElement>;
  readonly droneSize: number;
  readonly indoor: boolean;
  readonly grid: boolean | string;
  readonly navigation: {
    mode: 'walk' | 'fly';
    parameters: any;
  };
  readonly numDrones: number;
  readonly scaleLabels: boolean;
  readonly scenery: SceneryType;
  readonly showId: number;
  readonly showLabels: boolean;
  readonly showStatistics: boolean;
  readonly vrEnabled?: boolean;
};

const DEFAULT_CAMERA_CONFIGURATION = {
  position: [0, 20, 50],
  rotation: [0, 0, 0],
};

const ThreeDView = React.forwardRef((props: ThreeDViewProps, ref) => {
  const {
    axes,
    cameraConfiguration = DEFAULT_CAMERA_CONFIGURATION,
    cameraRef,
    droneSize,
    grid,
    indoor,
    navigation,
    numDrones,
    scaleLabels,
    scenery,
    showId,
    showLabels,
    showStatistics,
    vrEnabled,
  } = props;

  const [cameraId, setCameraId] = useState(0);
  const [sceneLoaded, setSceneLoaded] = useState(false);

  const extraCameraProps = {
    'look-controls': objectToString({
      enabled: false,
    }),
    'wasd-controls': objectToString({
      enabled: false,
    }),
    'advanced-camera-controls': objectToString({
      acceptsKeyboardEvent: 'notEditable',
      fly: navigation && navigation.mode === 'fly',
      minAltitude: 0.5,
      reverseMouseDrag: true,
    }),
  };
  const extraSceneProps: Record<string, string> = {};
  const isLightScenery = scenery === 'day';
  const isSceneryEnabled = scenery !== 'disabled';

  if (showStatistics) {
    extraSceneProps.stats = 'true';
  }

  extraSceneProps['vr-mode-ui'] = config.modes.vr
    ? 'enabled: true; enterVRButton: #vr-button'
    : 'enabled: false';

  if (!isSceneryEnabled) {
    extraSceneProps.background = 'color: black';
  }

  // Updating the camera is tricky. We need to reset the camera position and
  // rotation to the one prescribed by its props whenever the user loads a
  // new show. The easiest way to achieve this is to assign a new key to the
  // camera whenever a new show is loaded because this would unmount the old
  // camera and mount a new one. However, we must _not_ unmount the camera
  // when the scene is still loading, because it would cause the loading screen
  // of the scene to get stuck. This is easy to trigger in Firefox, a bit harder
  // in Chrome, but it's still a problem in both cases. That's why we need a
  // separate cameraId and sceneLoaded state
  useEffect(() => {
    if (showId !== cameraId && (cameraRef.current as any)?.sceneEl?.hasLoaded) {
      console.log('Updating camera ID to', showId);
      setCameraId(showId);
    }
  }, [cameraId, cameraRef, showId]);

  return (
    <a-scene
      ref={ref}
      deallocate
      keyboard-shortcuts={objectToString({ enterVR: vrEnabled })}
      loading-screen='backgroundColor: #444; dotsColor: #888'
      renderer='antialias: false'
      {...extraSceneProps}
    >
      <a-assets>
        <img crossOrigin='anonymous' id='glow-texture' src={glow} />
        {/* <a-asset-item id="flapper" src={flapperDrone} /> */}
      </a-assets>

      <a-camera
        key={`camera-${cameraId}`}
        ref={cameraRef}
        sync-pose-with-store=''
        id='three-d-camera'
        position={cameraConfiguration.position.join(' ')}
        rotation={cameraConfiguration.rotation.join(' ')}
        {...extraCameraProps}
      />

      <a-entity rotation='-90 0 90'>
        {axes && <CoordinateSystemAxes length={10} lineWidth={10} />}
        <a-drone-flock
          drone-size={droneSize}
          label-color={isLightScenery ? 'black' : 'white'}
          indoor={indoor}
          scale-labels={scaleLabels}
          show-glow={!isLightScenery}
          show-labels={showLabels}
          size={numDrones}
        />
      </a-entity>

      <Scenery type={scenery} grid={grid} />
    </a-scene>
  );
});

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    cameraConfiguration: getInitialCameraConfigurationOfShow(state),
    droneSize: getPreferredDroneRadius(state),
    indoor: isShowIndoor(state),
    numDrones: getNumberOfDronesInShow(state),
    showId: getLoadedShowId(state),
    ...state.settings.threeD,
    ...state.threeD,
    scenery: getEffectiveScenery(state),
  }),
  // mapDispatchToProps
  {},
  // mergeProps
  null,
  { forwardRef: true }
)(ThreeDView);
