/**
 * VAST3 parser.
 */

/* tslint:disable: no-any no-string-literal */

import * as VAST3 from '../definitions/VAST3';
import {VAST3Schema} from '../schema/VAST3';
import {Parser} from './Parser';

import {ObjectSchema} from 'joi';
import * as _ from 'lodash';
import {toXml} from 'xml2json';

export class VAST3Parser extends Parser<VAST3.IVAST3> {
  /**
   * Document schema.
   */
  protected schema: ObjectSchema = VAST3Schema;

  /**
   * Parses document.
   */
  protected async parseDoc(): Promise<VAST3.IVAST3> {
    const version: string = _.get<string>(this.xmlObj, 'VAST[0].version');
    const vastTags: any[] = _.get<any[]>(this.xmlObj, 'VAST');

    if (!Array.isArray(vastTags) || !vastTags.length) {
      throw new Error('No <VAST> root tag');
    }
    if (vastTags.length > 1) {
      throw new Error('Only one <VAST> tag is allowed');
    }
    return <VAST3.IVAST3>{
      version,
      ads: this.parseAds(),
    };
  }

  /**
   * Parses the Ads.
   */
  private parseAds(): VAST3.Ad[] {
    const parsedAds: any[] = _.get<any[]>(this.xmlObj, 'VAST[0].Ad');

    if (_.isArray(parsedAds)) {
      return parsedAds.map((adObj: any) => VAST3Parser.parseAd(adObj))
        .filter((ad: VAST3.Ad): boolean => !!ad);
    }
    return [];
  }
  /**
   * Parses an Ad.
   */
  private static parseAd(adContainer: any): VAST3.Ad {
    let adObj: any;
    const ad: VAST3.Ad = <VAST3.Ad>{};

    if (adContainer.InLine && adContainer.InLine.length) {
      ad.adType = VAST3.AdType.inline;
      if (adContainer.Wrapper && adContainer.Wrapper.length) {
        throw new Error('<Ad> cannot contain a <Inline> AND a <Wrapper> element');
      }
    } else if (adContainer.Wrapper && adContainer.Wrapper.length) {
      ad.adType = VAST3.AdType.wrapper;
      if (adContainer.InLine && adContainer.InLine.length) {
        throw new Error('<Ad> cannot contain a <Inline> AND a <Wrapper> element');
      }
    }
    switch (ad.adType) {
      case VAST3.AdType.inline:
        adObj = adContainer.InLine[0];
        VAST3Parser.setInilineSpecificProperties(adObj, ad);
        break;
      case VAST3.AdType.wrapper:
        adObj = adContainer.Wrapper[0];
        ad.VASTAdTagURI = _.get<string>(adObj, 'VASTAdTagURI[0].$t');
        break;
      default:
        throw new Error('<Ad> element does not contains an <Inline> or <Wrapper> element');
    }
    ad.adSystem = <VAST3.IAdSystem>{
      name   : _.get<string>(adObj, 'AdSystem[0].$t'),
      version: _.get<string>(adObj, 'AdSystem[0].version'),
    };
    ad.id = _.get<string>(adContainer, 'id');
    ad.sequence = parseInt(_.get<string>(adContainer, 'sequence'), 10) || undefined;
    ad.error = _.get<string>(adObj, 'Error[0].$t');
    ad.impressions = VAST3Parser.parseImpressions(adObj);
    ad.creatives = VAST3Parser.parseCreatives(adObj);
    if (
      (_.isArray(adObj.Extensions) && adObj.Extensions.length) &&
      (_.isArray(adObj.Extensions[0].Extension) && adObj.Extensions[0].Extension.length)
    ) {
      ad.extensions = adObj.Extensions[0].Extension;
    }
    return ad;
  }

  /**
   * Set Inline specific properties in ad object.
   *
   * @param adObj Parsed Inline tag.
   * @param ad    Ad object (passed by ref).
   */
  private static setInilineSpecificProperties(adObj: any, ad: VAST3.IInlineAd): void {
    ad.adTitle = _.get<string>(adObj, 'AdTitle[0].$t') || '';
    ad.description = _.get<string>(adObj, 'Description[0].$t');
    ad.advertiser = _.get<string>(adObj, 'Advertiser[0].$t');
    ad.pricing = VAST3Parser.parsePricing(adObj);
    ad.survey = _.get<string>(adObj, 'Survey[0].$t');
  }

  /**
   * Parses the Pricing tags.
   */
  private static parsePricing(adObj: any): VAST3.IAdPricing {
    const pricingObj: any = _.get<string>(adObj, 'Pricing[0]');

    if (!pricingObj) {
      return undefined;
    }
    return <VAST3.IAdPricing>{
      value   : parseFloat(pricingObj['$t']),
      currency: pricingObj.currency,
      model   : <VAST3.AdPricingModel>((<any>VAST3.AdPricingModel)[pricingObj.model]),
    };
  }
  /**
   * Parses the Impression tags.
   */
  private static parseImpressions(adObj: any): VAST3.IAdImpression[] {
    const impressions: VAST3.IAdImpression[] = [];

    if (_.isArray(adObj.Impression) && adObj.Impression.length) {
      adObj.Impression.forEach((impressionObj: any) => {
        impressions.push(<VAST3.IAdImpression>{
          uri: _.get<string>(impressionObj, '$t'),
          id : _.get<string>(impressionObj, 'id'),
        });
      });
    }
    return impressions.length ? impressions : undefined;
  }
  /**
   * Parses the Creative tags.
   */
  private static parseCreatives(adObj: any): VAST3.ICreative[] {
    if (!_.isArray(adObj.Creatives) || !adObj.Creatives.length) {
      return undefined;
    }
    if (!_.isArray(adObj.Creatives[0].Creative) || !adObj.Creatives[0].Creative.length) {
      return [];
    }
    return adObj.Creatives[0].Creative.map((creativeObj: any) =>
        VAST3Parser.parseCreative(creativeObj))
      .filter((tracking: VAST3.ITrackingEvent): boolean => !!tracking);
  }
  /**
   * Parses the Creative tags.
   */
  private static parseCreative(creativeContainer: any): VAST3.ICreative {
    const creative: VAST3.ICreative = <VAST3.ICreative>{};
    let creativeObj: any;

    if (!_.isArray(creativeContainer.Linear) || !creativeContainer.Linear.length) {
      // @todo handle CompanionAds and NonLinearAds
      if (!_.isArray(creativeContainer.CompanionAds) && !_.isArray(creativeContainer.NonLinearAds)) {
        throw new Error('<Creative> should contain one <Linear>, <CompanionAds> or <NonLinearAds>');
      }
      return undefined;
    }
    if (creativeContainer.Linear.length > 1) {
      throw new Error('<Creative> can contain only one <Linear>');
    }
    creativeObj = creativeContainer.Linear[0];
    creative.creativeType = VAST3.CreativeType.linear;
    creative.duration = _.get<string>(creativeObj, 'Duration[0].$t');
    creative.adParameters = VAST3Parser.parseAdParameters(creativeObj);
    creative.skipoffset = _.get<string>(creativeObj, 'skipoffset');
    creative.id = _.get<string>(creativeContainer, 'id');
    creative.adID = _.get<string>(creativeContainer, 'AdID');
    creative.sequence = _.get<number>(creativeContainer, 'sequence');
    if (
      _.isArray(creativeObj.CreativeExtensions) &&
      creativeObj.CreativeExtensions.length
    ) {
      if (creativeObj.CreativeExtensions.length > 1) {
        throw new Error('<Creative> can contain only one <CreativeExtensions>');
      }
      if (
        _.isArray(creativeObj.CreativeExtensions[0].CreativeExtension) &&
        creativeObj.CreativeExtensions[0].CreativeExtension.length
      ) {
        creative.extensions =
          creativeObj.CreativeExtensions[0].CreativeExtension;
      }
    }
    creative.trackings = VAST3Parser.parseTrackings(creativeObj);
    creative.videoClicks = VAST3Parser.parseClicks(creativeObj);
    creative.mediaFiles = VAST3Parser.parseMediaFiles(creativeObj);
    return creative;
  }
  /**
   * Parses the AdParameters tag.
   */
  private static parseAdParameters(creativeObj: any): VAST3.IAdParameters {
    const adParametersList: any[] = _.get<any[]>(creativeObj, 'AdParameters');

    if (!_.isArray(adParametersList)) {
      return undefined;
    }
    if (adParametersList.length > 1) {
      throw new Error('<Creative> can contain only one <AdParameters>');
    }
    const adParameters: any = adParametersList[0];
    const xmlEncoded: boolean = (
      _.isString(adParameters.xmlEncoded) &&
      (adParameters.xmlEncoded === 'true')
    );
    const value: any = (xmlEncoded) ?
      (adParameters || {}) :
      (adParameters['$t']) ?
        adParameters['$t'] :
        toXml(_.pickBy(adParameters, _.isObject));

    return (<VAST3.IAdParameters>{xmlEncoded, value});
  }
  /**
   * Parses the TrackingEvents tag.
   */
  private static parseTrackings(creativeObj: any): VAST3.ITrackingEvent[] {
    const trackingEvents: any[] = _.get<any[]>(creativeObj, 'TrackingEvents');

    if (!_.isArray(trackingEvents) || !trackingEvents.length) {
      return undefined;
    }
    if (trackingEvents.length > 1) {
      throw new Error('<Creative> can contain only one <TrackingEvents>');
    }
    if (!_.isArray((<any>trackingEvents[0]).Tracking) || !(<any>trackingEvents[0]).Tracking.length) {
      return undefined;
    }

    return (<any>trackingEvents[0]).Tracking.map((trackingObj: any): VAST3.ITrackingEvent =>
        (<VAST3.ITrackingEvent>{
          event : parseInt((<any>VAST3.TrackingEventType)[trackingObj.event], 10),
          uri   : trackingObj['$t'],
          offset: trackingObj.offset,
        }))
      .filter((tracking: VAST3.ITrackingEvent) => !_.isUndefined(tracking));
  }
  /**
   * Parses the VideoClicks tag.
   */
  private static parseClicks(creativeObj: any): VAST3.IVideoClick {
    const videoClicks: any[] = _.get<any[]>(creativeObj, 'VideoClicks');

    if (!_.isArray(videoClicks) || !videoClicks.length) {
      return undefined;
    }
    if (videoClicks.length > 1) {
      throw new Error('<Creative> can contain only one <VideoClicks>');
    }
    if (_.isArray((<any>videoClicks[0]).ClickThrough) && (<any>videoClicks[0]).ClickThrough.length > 1) {
      throw new Error('<VideoClicks> can contain only one <ClickThrough>');
    }

    const clickThrough: string = _.get<string>(videoClicks[0], 'ClickThrough[0].$t');
    const clicks: VAST3.IVideoClick = <VAST3.IVideoClick>{
      clickThrough : (_.isString(clickThrough) && clickThrough) ?
        (<VAST3.IClickTracking>{
          uri: clickThrough,
          id : (<any>videoClicks[0]).ClickThrough[0].id,
        }) : undefined,
    };

    if (_.isArray((<any>videoClicks[0]).ClickTracking) && (<any>videoClicks[0]).ClickTracking.length) {
      clicks.clickTrackings = (<any>videoClicks[0]).ClickTracking.map((node: any) => (<VAST3.IClickTracking>{
          uri: node['$t'],
          id : node.id,
        }))
        .filter((click: VAST3.IClickTracking) => click && click.uri);
    }
    if (_.isArray((<any>videoClicks[0]).CustomClick) && (<any>videoClicks[0]).CustomClick.length) {
      clicks.customClicks = (<any>videoClicks[0]).CustomClick.map((node: any) => (<VAST3.IClickTracking>{
          uri: node['$t'],
          id : node.id,
        }))
        .filter((click: VAST3.IClickTracking) => click && click.uri);
    }
    return (clicks.clickThrough || clicks.clickTrackings || clicks.customClicks) ?
      clicks :
      undefined;
  }
  /**
   * Parses the MediaFiles tag.
   */
  private static parseMediaFiles(creativeObj: any): VAST3.IMediaFile[] {
    const mediaFilesObj: any = _.get<any>(creativeObj, 'MediaFiles[0].MediaFile');
    let mediaFiles: VAST3.IMediaFile[];

    if (_.isArray(mediaFilesObj) && mediaFilesObj.length) {
      mediaFiles = mediaFilesObj
        .map(VAST3Parser.parseMediaFile)
        .filter((file: VAST3.IMediaFile) => !_.isUndefined(file));
    }
    return (_.isArray(mediaFiles) && mediaFiles.length) ? mediaFiles : undefined;
  }
  /**
   * Parses the MediaFile tag.
   */
  private static parseMediaFile(mediafileObj: any): VAST3.IMediaFile {
    if (!_.isObject(mediafileObj) || !(
        mediafileObj.delivery &&
        mediafileObj.type &&
        mediafileObj.width &&
        mediafileObj.height &&
        mediafileObj['$t']
      )) {
      return undefined;
    }
    const mediaFile: VAST3.IMediaFile = <VAST3.IMediaFile>_.assign(
      {},
      {
        uri     : mediafileObj['$t'],
        mimetype: mediafileObj.type,
      },
      _.pick(mediafileObj, [
        'delivery',
        'mimetype',
        'width',
        'height',
        'id',
        'bitrate',
        'minBitrate',
        'maxBitrate',
        'scalable',
        'maintainAspectRatio',
        'apiFramework',
        'codec',
      ])
    );
    ['width', 'height', 'bitrate', 'minBitrate', 'maxBitrate'].forEach((name: string) => {
      if (!_.isUndefined((<any>mediaFile)[name])) {
        (<any>mediaFile)[name] = parseInt((<any>mediaFile)[name], 10);
      }
    });
    ['scalable', 'maintainAspectRatio'].forEach((name: string) => {
      if (!_.isUndefined((<any>mediaFile)[name])) {
        (<any>mediaFile)[name] = !((<any>mediaFile)[name] === 'false');
      }
    });
    mediaFile.delivery = (<any>VAST3.DeliveryType)[mediaFile.delivery];
    return mediaFile;
  }
}
/* tslint:enable: no-any no-string-literal */
