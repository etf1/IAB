/**
 * VAST3 Joi schema.
 */

import * as VAST3 from '../definitions/VAST3';

import * as Joi from 'joi';

// @todo Use language to generate more HR messages.

/**
 * Get enums values.
 */
const getEnumValues: Function = (enumObj: {}): number[] => Object.keys(enumObj)
    .filter((key: string): boolean => /^\d+$/.test(key))
    .map((value: string): number => parseInt(value, 10));

/**
 * Regexes
 */
// xx:xx:xx[.xxx]
const timeRegex: RegExp = /^(?:[1-9][\d]+|0[0-9]):[0-5]\d:[0-5]\d(?:\.\d\d\d)?$/;
// xx:xx:xx[.xxx] or xx%
const timeOrPercentRegex: RegExp = /^(?:(?:(?:[1-9][\d]+|0[0-9]):[0-5]\d:[0-5]\d(?:\.\d\d\d)?)|(?:[1-9][0-9]?|100|0)(?:\.\d+)?%)$/;

/**
 * Valid uris.
 * JOI uri parser is too strict ...
 */
/* tslint:disable: variable-name */
const UriSchema: Joi.StringSchema = Joi
  .string()
  .regex(/^https?:\/\/.*/);
/* tslint:enable: variable-name */

/**
 * <Pricing> schema.
 */
const pricingSchema: Joi.ObjectSchema = Joi
  .object()
  .keys({
    value: Joi
      .number()
      .min(0)
      .required()
      .description('The price value'),

    model: Joi
      .number()
      .integer()
      .positive()
      .valid(getEnumValues(VAST3.AdPricingModel))
      .required()
      .description('Pricing model'),

    currency: Joi
      .string()
      .regex(/^[a-zA-Z]{3}$/)
      .required()
      .description('Price value\'s currency code'),
  })
  .unknown(false);

/**
 * <AdSystem> schema.
 */
const adSystemSchema: Joi.ObjectSchema = Joi
  .object()
  .keys({
    name: Joi
      .string()
      .required()
      .description('Ad server name'),

    version: Joi
      .string()
      .optional()
      .description('Ad server version'),
  })
  .unknown(false);

/**
 * <Impression> schema.
 */
const impressionSchema: Joi.ObjectSchema = Joi
  .object()
  .keys({
    uri: UriSchema
      .required()
      .description('Uri to request'),

    id: Joi
      .string()
      .allow('')
      .optional()
      .description('Unique id of the impression tracker'),
  })
  .unknown(false);

/**
 * <Extension> or <CreativeExtention> schema.
 */
const extensionSchema: Joi.ObjectSchema = Joi
  .object()
  .unknown(true);

/**
 * <AdParameters> schema.
 */
const adParametersSchema: Joi.ObjectSchema = Joi
  .object({
    xmlEncoded: Joi
      .boolean()
      .required()
      .description('Specifies whether the parameters are XML-encoded'),

    value: Joi
      .any()
      .when(
        'xmlEncoded',
        {
          is: true,
          then: Joi.object().unknown(true).default({}),
          otherwise: Joi.string().allow('').default(''),
        }
      )
      .optional()
      .description('Parameters value'),
  })
  .unknown(false);

/**
 * <Tracking> schema.
 */
const offsetTrackingSchema = Joi
  .string()
  .regex(timeOrPercentRegex);

const trackingSchema: Joi.ObjectSchema = Joi
  .object({
    event: Joi
      .number()
      .integer()
      .positive()
      .valid(getEnumValues(VAST3.TrackingEventType))
      .required()
      .description('The event to track'),

    uri: UriSchema
      .required()
      .description('URI to call for specified event type'),

    offset: offsetTrackingSchema
      .when(
        'event',
        {
          is: VAST3.TrackingEventType.progress,
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        }
      )
      .description('The time during the video at which this uri should be pinged'),
  })
  .unknown(false);

/**
 * <ClickThrough>, <clickTracking> and <CustomClick> schemas.
 */
const videoClickSchema: Joi.ObjectSchema = Joi
  .object({
    uri: UriSchema
      .required()
      .description('Uri of the click destination'),

    id: Joi
      .string()
      .allow('')
      .optional()
      .description('Optional id for VideoClicks uris'),
  })
  .unknown(false);

/**
 * <VideoClicks> schemas.
 */
const videoClicksSchema: Joi.ObjectSchema = Joi
  .object({
    clickThrough: videoClickSchema
      .optional()
      .description('Uri to open as destination page when user clicks on the video'),

    clickTrackings: Joi
      .array()
      .sparse(false)
      .items(videoClickSchema)
      .optional()
      .description('Uris to request for tracking purposes when user clicks on the video'),

    customClicks: Joi
      .array()
      .sparse(false)
      .items(videoClickSchema)
      .optional()
      .description('Uris to request on custom events such as hotspotted video'),
  })
  .unknown(false);

/**
 * <MediaFile> schemas.
 */
const mediaFileSchema: Joi.ObjectSchema = Joi
  .object({
    uri: Joi
      .string()
      .min(1)
      .required()
      .description('Location of the media (uri or any unique value)'),

    delivery: Joi
      .number()
      .integer()
      .positive()
      .valid(getEnumValues(VAST3.DeliveryType))
      .required()
      .description('Delivery method of ad'),

    mimetype: Joi
      .string()
      .required()
      .description('Media mime type'),

    width: Joi
      .number()
      .integer()
      .required()
      .unit('pixels')
      .description('Width of ad'),

    height: Joi
      .number()
      .integer()
      .required()
      .unit('pixels')
      .description('Height of ad'),

    id: Joi
      .string()
      .allow('')
      .optional()
      .description('Media file identifier'),

    bitrate: Joi
      .number()
      .integer()
      .positive()
      .optional()
      .unit('Kbps')
      .description('Bitrate of stream'),

    minBitrate: Joi
      .number()
      .integer()
      .positive()
      .optional()
      .unit('Kbps')
      .description('Minimum bitrate of stream'),

    maxBitrate: Joi
      .number()
      .integer()
      .positive()
      .optional()
      .unit('Kbps')
      .description('Maximum bitrate of stream'),

    codec: Joi
      .string()
      .allow('')
      .optional()
      .description('The codec used to produce the media file'),

    scalable: Joi
      .boolean()
      .optional()
      .description('Whether it is acceptable to scale the image'),

    maintainAspectRatio: Joi
      .boolean()
      .optional()
      .description('Whether the ad must have its aspect ratio maintained when scales'),

    apiFramework: Joi
      .string()
      .allow('')
      .optional()
      .description('Method to use for communication if the MediaFile is interactive'),
  })
  .nand('bitrate', 'minBitrate')
  .nand('bitrate', 'maxBitrate')
  .and('minBitrate', 'maxBitrate')
  .unknown(false);

/**
 * Inline <Creative> schema.
 */
const inlineCreativeSchema: Joi.ObjectSchema = Joi
  .object()
  .keys({
    creativeType: Joi
      .number()
      .valid([VAST3.CreativeType.linear])
      .required()
      .description('Creative type'),

    duration: Joi
      .string()
      .regex(timeRegex)
      .required()
      .description('Creative \'s duration'),

    extensions: Joi
      .array()
      .sparse(false)
      .items(extensionSchema)
      .optional()
      .description('Creative extensions objects'),

    adParameters: adParametersSchema
      .optional()
      .description('Data to be passed into the video ad'),

    trackings: Joi
      .array()
      .sparse(false)
      .items(trackingSchema)
      .optional()
      .description('Tracking URIs for events specific to creative'),

    videoClicks: videoClicksSchema
      .optional()
      .description('Uri to request for video clicks tracking'),

    mediaFiles: Joi
      .array()
      .sparse(false)
      .min(1)
      .items(mediaFileSchema)
      .optional()
      .description('Media files of the creative'),

    skipoffset: Joi
      .string()
      .regex(timeOrPercentRegex)
      .optional()
      .description('The time at which the ad becomes skippable'),

    id: Joi
      .string()
      .allow('')
      .optional()
      .description('Creative identifier'),

    sequence: Joi
      .number()
      .integer()
      .optional()
      .description('The preferred order in which multiple Creatives should be displayed'),

    adID: Joi
      .string()
      .allow('')
      .optional()
      .description('Ad-ID for the creative (formerly ISCI) for wrapped Ads'),
  })
  .unknown(false);

/**
 * Wrapper <Creative> schema.
 */
const wrapperCreativeSchema: Joi.ObjectSchema = Joi
  .object()
  .keys({
    creativeType: Joi
      .number()
      .valid([VAST3.CreativeType.linear])
      .required()
      .description('Creative type'),

    extensions: Joi
      .array()
      .sparse(false)
      .items(extensionSchema)
      .optional()
      .description('Creative extensions objects'),

    trackings: Joi
      .array()
      .sparse(false)
      .items(trackingSchema)
      .optional()
      .description('Tracking URIs for events specific to creative'),

    videoClicks: videoClicksSchema
      .optional()
      .description('Uri to request for video clicks tracking'),

    id: Joi
      .string()
      .allow('')
      .optional()
      .description('Creative identifier'),

    sequence: Joi
      .number()
      .integer()
      .optional()
      .description('The preferred order in which multiple Creatives should be displayed'),

    adID: Joi
      .string()
      .allow('')
      .optional()
      .description('Ad-ID for the creative (formerly ISCI) for wrapped Ads'),
  })
  .unknown(true);

/**
 * Common values of all ads.
 */
const adSchema: Joi.ObjectSchema = Joi
  .object()
  .keys({
    adType: Joi
      .number()
      .integer()
      .positive()
      .valid(getEnumValues(VAST3.AdType))
      .required()
      .description('Ad type'),

    adSystem: adSystemSchema
      .required()
      .description('Ad system source for the ad'),

    VASTAdTagURI: Joi
      .any()
      .when(
        'adType',
        {
          is: VAST3.AdType.wrapper,
          then: UriSchema.required(),
          otherwise: Joi.forbidden(),
        }
      )
      .description('Uri of ad tag of downstream Secondary Ad Server'),

    adTitle: Joi
      .any()
      .when(
        'adType',
        {
          is: VAST3.AdType.inline,
          then: Joi
            .string()
            .allow('')
            .required(),
          otherwise: Joi.forbidden(),
        }
      )
      .description('Common name of ad'),

    impressions: Joi
      .array()
      .min(1)
      .sparse(false)
      .items(impressionSchema)
      .required()
      .description('Uri to request for impression tracking'),

    // @todo should .min(1) when CompanionAds and NonLinearAds are handled
    creatives: Joi
      .any()
      .when(
        'adType',
        {
          is: VAST3.AdType.inline,
          then: Joi.array().sparse(false).items(inlineCreativeSchema),
          otherwise: Joi.array().sparse(false).items(wrapperCreativeSchema),
        }
      )
      .required()
      .description('Ad\'s creatives'),

    id: Joi
      .string()
      .allow('')
      .optional()
      .description('Ad identifier'),

    sequence: Joi
      .number()
      .integer()
      .optional()
      .description('The preferred order in which multiple Ad should be displayed'),

    error: UriSchema
      .optional()
      .description('Uri to request if ad does not play due to error'),

    extensions: Joi
      .array()
      .sparse(false)
      .items(extensionSchema)
      .optional()
      .description('Ad extensions objects'),

    description: Joi
      .any()
      .when(
        'adType',
        {
          is: VAST3.AdType.inline,
          then: Joi
            .string()
            .allow('')
            .optional(),
          otherwise: Joi.forbidden(),
        }
      )
      .description('Longer description of ad'),

    advertiser: Joi
      .any()
      .when(
        'adType',
        {
          is: VAST3.AdType.inline,
          then: Joi
            .string()
            .allow('')
            .optional(),
          otherwise: Joi.forbidden(),
        }
      )
      .description('Common name of advertiser'),

    survey: Joi
      .any()
      .when(
        'adType',
        {
          is: VAST3.AdType.inline,
          then: UriSchema
            .optional(),
          otherwise: Joi.forbidden(),
        }
      )
      .description('Uri of request to survey vendor'),

    pricing: Joi
      .any()
      .when(
        'adType',
        {
          is: VAST3.AdType.inline,
          then: pricingSchema.optional(),
          otherwise: Joi.forbidden(),
        }
      )
      .description('Ad displaying pricing'),
  })
  // @todo : find a way a better alternative of any().when() (sic.)
  // for (adSchema & (inline AdSchema | wrapper AdSchema))
  .unknown(false);

/**
 * Full VAST Schema.
 */
/* tslint:disable: variable-name */
export const VAST3Schema: Joi.ObjectSchema = Joi
/* tslint:enable: variable-name */
  .object()
  .keys({
    ads: Joi
      .array()
      .sparse(false)
      .items(adSchema)
      .required()
      .description('Ads of the document'),

    version: Joi
      .string()
      .regex(/^[2|3](?:\.\d+)?$/)
      .required()
      .description('VAST Version should be compatible to 3'),
  })
  .unknown(false)
  .required();
