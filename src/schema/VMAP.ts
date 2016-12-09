/**
 * VMAP Joi schema.
 */

import * as VMAP from '../definitions/VMAP';
import { VAST3Schema } from '../schema/VAST3';

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
 */
// @todo remove no-any when/if https://github.com/DefinitelyTyped/DefinitelyTyped/pull/13227 gets merged.
/* tslint:disable: variable-name no-any */
const UriSchema: Joi.StringSchema = Joi.string().uri((<any>{
  scheme: ['http', 'https'],
  allowRelative: false,
}));
/* tslint:enable: variable-name no-any */

/**
 * AdSource schema.
 */
const adSourceSchema = Joi
  .object()
  .keys({
    dataType: Joi
      .number()
      .integer()
      .positive()
      .valid(getEnumValues(VMAP.AdSourceTypes))
      .required()
      .description('AdSource data type'),

    VASTAdData: Joi
      .any()
      .when(
        'dataType',
        {
          is: VMAP.AdSourceTypes.VAST3,
          then: VAST3Schema.required(),
          otherwise: Joi.forbidden(),
        }
      )
      .description('VAST3 data'),

    adTagURI: Joi
      .any()
      .when(
        'dataType',
        {
          is: VMAP.AdSourceTypes.adTagURI,
          then: UriSchema.required(),
          otherwise: Joi.forbidden(),
        }
      )
      .description('Ad document (inline)'),

    customAdData: Joi
      .any()
      .when(
        'dataType',
        {
          is: VMAP.AdSourceTypes.custom,
          then: Joi.alternatives(
            Joi.string().allow(''),
            Joi.object().unknown(true)
          )
            .required(),
          otherwise: Joi.forbidden(),
        }
      )
      .description('Ad document (inline)'),

    adDataType: Joi
      .any()
      .when(
        'dataType',
        {
          is: VMAP.AdSourceTypes.VAST3,
          then: Joi.forbidden(),
          otherwise: Joi
            .number()
            .integer()
            .positive()
            .when(
              'dataType',
              {
                is: VMAP.AdSourceTypes.adTagURI,
                then: Joi.valid(getEnumValues(VMAP.adTagURITypes)),
                otherwise: Joi.valid(getEnumValues(VMAP.customAdSourceTypes)),
              }
            )
            .required(),
        }
      )
      .description('AdData type for adTagURI and custom dataType'),

    id: Joi
      .string()
      .optional()
      .description('Identifier for the ad source'),

    allowMultipleAds: Joi
      .boolean()
      .optional()
      .default(true)
      .description('If player should play multiple ads in an ad break'),

    followRedirects: Joi
      .boolean()
      .optional()
      .description('If player should follow wrappers/redirects in the ad response document'),
  })
  .unknown(false);

/**
 * Tracking schema.
 */
const trackingSchema = Joi
  .object()
  .keys({
    uri: UriSchema
      .required()
      .description('Uri to request'),

    level: Joi
      .number()
      .integer()
      .positive()
      .valid(getEnumValues(VMAP.TrackingEvent))
      .required()
      .description(' The VMAP ad break level event to track'),
  })
  .unknown(false);

/**
 * Extension schema.
 */
const extensionsSchema = Joi
  .object()
  .keys({
    extensionType: Joi
      .string()
      .min(1)
      .required()
      .description('Extension type (generally an uri)'),

    value: Joi
      .alternatives(
        Joi.string().allow(''),
        Joi.object().unknown(true),
      )
      .required()
      .description('Extension value'),
  })
  .unknown(false);

/**
 * AdBreak Schema.
 */
const adSchema: Joi.ObjectSchema = Joi
  .object()
  .keys({
    timeOffset: Joi
      .alternatives()
      .try(
        Joi
          .string()
          .regex(timeOrPercentRegex),
        Joi
          .string()
          .valid(['start', 'end']),
        Joi
          .string()
          .regex(/^#\d+$/)
      )
      .required()
      .description('AdBreak time offset'),

    breakTypes: Joi
      .array()
      .sparse(false)
      .min(1)
      .items(
        Joi
          .number()
          .integer()
          .positive()
          .valid(getEnumValues(VMAP.AdBreakType))
      )
      .required()
      .description('AdBreak type'),

    id: Joi
      .string()
      .allow('')
      .optional()
      .description('AdBreak identifier'),

    repeatAfter: Joi
      .string()
      .regex(timeRegex)
      .optional()
      .description('Repeat same AdBreak at time offsets equal to the duration'),

    source: adSourceSchema
      .optional()
      .description('Ad data that will be used to fill the ad break'),

    trackings: Joi
      .array()
      .min(0)
      .sparse(false)
      .items(trackingSchema)
      .optional()
      .description('Tracking URIs for events specific to VMAP'),

    extensions: Joi
      .array()
      .min(0)
      .sparse(false)
      .items(extensionsSchema)
      .optional()
      .description('Extensions that express additional information not supported by VMAP'),

  })
  .unknown(false);

/**
 * Full VMAP Schema.
 */
/* tslint:disable: variable-name */
export const VMAPSchema: Joi.ObjectSchema = Joi
/* tslint:enable: variable-name */
  .object()
  .keys({
    breaks: Joi
      .array()
      .sparse(false)
      .items(adSchema)
      .required()
      .description('Defined ad breaks'),

    version: Joi
      .string()
      .regex(/^1(?:\.\d+)?$/)
      .required()
      .description('VMAP Version should be compatible to ^1.0'),
  })
  .unknown(false)
  .required();
