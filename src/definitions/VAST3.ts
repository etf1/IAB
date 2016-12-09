/**
 * VAST documents interface.
 */

/**
 * IAB VAST, Video Ad Serving Template, video xml ad response.
 */
export interface IVAST3 {
  // Ads.
  ads: Ad[];
  // Version.
  version: string;
}

/**
 * Top-level element, wraps each ad in the response.
 */
export interface IBaseAd {
  // Ad type.
  adType: AdType;
  // Indicates source ad server.
  adSystem: IAdSystem;
  // Impression trackers.
  impressions: IAdImpression[];
  // Contains all creative elements within an InLine or Wrapper Ad.
  creatives: ICreative[];

  // Ad identifier.
  id?: string;
  // Identifies the sequence of multiple Ads and defines an Ad Pod.
  sequence?: number;
  // Uri to request if ad does not play due to error.
  error?: string;
  // Ad extensions.
  extensions?: Object[];
}

/**
 * Inline ad.
 */
export interface IInlineAd extends IBaseAd {
  // Ad type.
  adType: AdType.inline;
  // Common name of ad.
  adTitle: string;

  // Longer description of ad.
  description?: string;
  // Common name of advertiser.
  advertiser?: string;
  // Ad pricing.
  pricing?: IAdPricing;
  // Uri of request to survey vendor.
  survey?: string;
}

/**
 * Wrapped ad.
 */
export interface IWrappedAd extends IBaseAd {
  // Ad type.
  adType: AdType.wrapper;
  // Uri of ad tag of downstream Secondary Ad Server.
  VASTAdTagURI: string;
}

export type Ad = IInlineAd | IWrappedAd;

/**
 * Ad types.
 */
export enum AdType {
  inline = 1,
  wrapper = 2,
}

/**
 * AdSystem .
 */
export interface IAdSystem {
  // Ad server name.
  name: string;
  // Internal version used by ad system.
  version?: string;
}

/**
 * Ad's pricing.
 */
export interface IAdPricing {
  // Price.
  value: number;
  // Pricing model.
  model: AdPricingModel;
  // Currency (http://www.xe.com/iso4217.php).
  currency: string;
}

/**
 * Ad pricing models.
 */
export enum AdPricingModel {
  // Cost per click.
  cpc = 1,
    // Cost per mille.
  cpm = 2,
    // Cost per engagement.
  cpe = 3,
    // Cost per view.
  cpv = 4,
}

/**
 * Ad impression tracker.
 */
export interface IAdImpression {
  // Uri of the impression tracker.
  uri: string;
  // Unique id of the impression tracker.
  id?: string;
}

/**
 * Wraps each creative element within an InLine or Wrapper Ad.
 */
export interface ICreative {
  // Creative type.
  creativeType: CreativeType;
  // Duration in standard time format, hh:mm:ss.
  duration: string;

  // Creative extensions.
  extensions?: Object[];
  // Data to be passed into the video ad.
  adParameters?: IAdParameters;
  // Event tracking.
  trackings?: ITrackingEvent[];
  // Click on video trackings.
  videoClicks?: IVideoClick;
  // Mediafiles of the creative.
  mediaFiles?: IMediaFile[];
  // The time at which the ad becomes skippable, if absent, the ad is not skippable.
  skipoffset?: string;
  // Identifier.
  id?: string;
  // The preferred order in which multiple Creatives should be displayed.
  sequence?: number;
  // Ad-ID for the creative (formerly ISCI) for wrapped Ads.
  adID?: string;
}

/**
 * Creative types.
 */
export enum CreativeType {
  // Linear ad.
  linear = 1,
}

/**
 * Container for ad parameters.
 */
export interface IAdParameters {
  // Specifies whether the parameters are XML-encoded.
  xmlEncoded: boolean;
  // The parameters.
  value: string | Object;
}

/**
 * Container for tracking URIs for events specific to creative.
 */
export interface ITrackingEvent {
  // The name of the event to track. For nonlinear ads these events should be
  // recorded on the video within the ad.
  event: TrackingEventType;
  // URI to call for specified event type.
  uri: string;

  // The time during the video at which this uri should be pinged.
  // Must be present for progress event.
  offset?: string;
}

/**
 * Tracking event types.
 */
export enum TrackingEventType {
  creativeView = 1,
  start = 2,
  firstQuartile = 3,
  midpoint = 4,
  thirdQuartile = 5,
  complete = 6,
  mute = 7,
  unmute = 8,
  pause = 9,
  rewind = 10,
  resume = 11,
  fullscreen = 12,
  exitFullscreen = 13,
  expand = 14,
  collapse = 15,
  acceptInvitation = 16,
  close = 17,
  skip = 18,
  progress = 19,
}

/**
 * Container for video clicks destination uri.
 */
export interface IVideoClick {
  // Uri to open as destination page when user clicks on the video.
  clickThrough?: IClickTracking;
  // Uris to request for tracking purposes when user clicks on the video.
  clickTrackings?: IClickTracking[];
  // Uris to request on custom events such as hotspotted video.
  customClicks?: IClickTracking[];
}

/**
 * Click tracking uri.
 */
export interface IClickTracking {
  // Uri to request on click.
  uri: string;
  // Optional id for this uri.
  id?: string;
}

/**
 * Container for creative's media file.
 */
export interface IMediaFile {
  // Location of linear file.
  uri: string;
  // Method of delivery of ad.
  delivery: DeliveryType;
  // MIME type. Popular MIME types include, but are not limited to
  // “video/x-ms-wmv” for Windows Media, and “video/x-flv” for Flash Video.
  // Image ads or interactive ads can be included in the MediaFiles section with
  // appropriate Mime.
  mimetype: string;
  // Pixel dimensions of video.
  width: number;
  // Pixel dimensions of video.
  height: number;

  // Optional identifier.
  id?: string;
  // Bitrate of encoded video in Kbps. If bitrate is supplied, minBitrate and
  // maxBitrate should not be supplied.
  bitrate?: number;
  // Minimum bitrate of an adaptive stream in Kbps. If minBitrate is supplied,
  // maxBitrate must be supplied and bitrate should not be supplied.
  minBitrate?: number;
  // Maximum bitrate of an adaptive stream in Kbps. If maxBitrate is supplied,
  // minBitrate must be supplied and bitrate should not be supplied.
  maxBitrate?: number;
  // Whether it is acceptable to scale the image.
  scalable?: boolean;
  // Whether the ad must have its aspect ratio maintained when scales.
  maintainAspectRatio?: boolean;
  // The apiFramework defines the method to use for communication if the MediaFile
  // is interactive. Suggested values for this element are “VPAID”, “FlashVars”
  // (for Flash/Flex), “initParams” (for Silverlight) and “GetVariables”.
  // (variables placed in key/value pairs on the asset request).
  apiFramework?: string;
  // The codec used to produce the media file.
  codec?: string;
}

/**
 * Mediafile delivery types.
 */
export enum DeliveryType {
  streaming = 1,
  progressive = 2,
}
