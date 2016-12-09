/**
 * VMAP documents interface.
 */

import { IVAST3 } from './VAST3';

/**
 * IAB VMAP, Video Multiple AD Playlist.
 */
export interface IVMAP {
  // VMAP version.
  version: string;
  // AdBreak list.
  breaks: IAdBreak[];
}

/**
 * AdBreak : Top-level element, represents a single ad break, but may allow for multiple ads.
 */
export interface IAdBreak {
  // Represent the timing for the ad break.
  // Expressed in one of four ways:
  // (1)time format HH:MM:SS[.mmm],
  // (2)n% (n is an integer from 0-100 and represents percentage of total
  //     duration from start to that point),
  // (3)“start” or “end”,
  // (4) #m (m is an integer & 0 and represents the position of the ad break
  //     opportunity)
  timeOffset: string;
  // The types of ads allowed by the ad break: "linear", "nonlinear" or "display"
  breakTypes: AdBreakType[];
  // AdBreak's ad source.
  source: IAdSource;
  // AdBreak's optional events to track.
  trackings?: ITrackingEvent[];
  // AdBreak optional extensions.
  extensions?: IExtension[];
  // Optional identifier for the ad break;
  id?: string;
  // Optional indicator that instructs the video player to repeat the same AdBreak
  // and AdSource at time offsets equal to the duration value of this attribute.
  // Expresssed in time format HH.MM.SS[.mmm].
  repeatAfter?: string;
}

/**
 * AdBreak types.
 */
export enum AdBreakType {
  linear = 1,
  nonlinear = 2,
  display = 3,
}

/**
 * AdBreak events types.
 */
export enum TrackingEvent {
  breakStart = 1,
  breakEnd = 2,
  error = 3,
}

/**
 * Container for tracking URIs for events specific to VMAP.
 */
export interface ITrackingEvent {
  // URI to request for specified event type.
  uri: string;
  // The VMAP ad break level event to track.
  level: TrackingEvent;
}

/**
 * Container for Extensions that express additional information not supported by VMAP.
 */
export interface IExtension {
  // Extension type (generally an uri).
  extensionType: string;
  // The extension values.
  value: string | Object;
}

/**
 * AdSource : Represents the ad data that will be used to fill the ad break.
 */
export interface IAdSource {
  // The AdSource data type.
  dataType: AdSourceTypes;
  // A VAST 3.0 document that comprises the ad response document.
  // Not contained within a CDATA. (There were are a couple of places where
  // the VMAP 1.0 pdf incorrectly references both VASTData and VASTAdData but
  // VASTAdData is the correct element per VMAP 1.0.1).
  VASTAdData?: IVAST3;
  // An ad response document (included inline) that is not VAST 3.0.
  customAdData?: string | Object;
  // Uri to a secondary ad server that will provide the ad response.
  // Uri must be contained within a CDATA block.
  adTagURI?: string;
  // AdData type (required for CustomAdData and AdTagURI, undefined for VASTAdData).
  adDataType?: customAdSourceTypes | adTagURITypes;
  // Identifier for the ad source.
  id?: string;
  // Indicates whether the player should select and play only a single ad from
  // the ad response document, or play multiple ads.
  // If not specified, video player accepts playing multiple ads in an ad break.
  allowMultipleAds?: boolean;
  // Whether the player should follow wrappers/redirects in the ad response
  // document. If not specified, left to the video player’s discretion.
  followRedirects?: boolean;
}

/**
 * AdSource types.
 */
export enum AdSourceTypes {
  VAST3 = 1,
  custom = 2,
  adTagURI = 3,
}

/**
 * CustomAdSource types.
 */
export enum customAdSourceTypes {
  vast1 = 1,
  vast2 = 2,
  proprietary = 3,
}

/**
 * AdTagURI types.
 */
export enum adTagURITypes {
  vast1 = 1,
  vast2 = 2,
  vast3 = 3,
  proprietary = 4,
}
