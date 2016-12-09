/**
 * VMAP parser.
 */

/* tslint:disable: no-any no-string-literal */

import * as VMAP from '../definitions/VMAP';
import { VMAPSchema } from '../schema/VMAP';
import { Parser } from './Parser';
import { VAST3Parser } from './VAST3';

import * as Bluebird from 'bluebird';
import {ObjectSchema} from 'joi';
import * as _ from 'lodash';

export class VMAPParser extends Parser<VMAP.IVMAP> {
  /**
   * Document schema.
   */
  protected schema: ObjectSchema = VMAPSchema;

  /**
   * Parses document.
   */
  protected async parseDoc(): Promise<VMAP.IVMAP> {
    const version: string = _.get<string>(this.xmlObj, 'vmap:VMAP[0].version');
    const vmapTags: any[] = _.get<any[]>(this.xmlObj, 'vmap:VMAP');

    if (!Array.isArray(vmapTags) || !vmapTags.length) {
      throw new Error('No <vmap:VMAP> root tag');
    }
    if (vmapTags.length > 1) {
      throw new Error('Only one <vmap:VMAP> tag is allowed');
    }
    return <VMAP.IVMAP>{
      version,
      breaks: (await this.parseBreaks()),
    };
  }

  /**
   * Parses the Ad breaks.
   */
  private async parseBreaks(): Promise<VMAP.IAdBreak[]> {
    const parsedBreaks: any[] = _.get<any[]>(this.xmlObj, 'vmap:VMAP[0].vmap:AdBreak');

    if (_.isArray(parsedBreaks)) {
      return Bluebird
        .map(parsedBreaks, (breakObj: any) => this.parseBreak(breakObj))
        .filter((adBreak: VMAP.IAdBreak): boolean => !!adBreak);
    }
    return [];
  }
  /**
   * Parses an Ad break.
   */
  private async parseBreak(adBreakObj: any): Promise<VMAP.IAdBreak> {
    return <VMAP.IAdBreak>{
      timeOffset: adBreakObj.timeOffset,
      breakTypes: this.parseBreakTypes(adBreakObj),
      source: (await this.parseSource(adBreakObj)),
      trackings: this.parseTrackings(adBreakObj),
      extensions: this.parseExtensions(adBreakObj),
      id: adBreakObj.breakId,
      repeatAfter: adBreakObj.repeatAfter,
    };
  }
  /**
   * Parses an Ad break's AdSource.
   */
  private parseBreakTypes(adBreakObj: any): VMAP.AdBreakType[] {
    if (!adBreakObj.breakType) {
      return undefined;
    }
    if (typeof adBreakObj.breakType !== 'string') {
      throw new Error('Invalid breakType');
    }
    return adBreakObj.breakType.trim().split(/\s*,\s*/)
      .map((typeValue: string): number => {
        const value: VMAP.AdBreakType = <VMAP.AdBreakType>((<any>VMAP.AdBreakType)[typeValue]);
        return <VMAP.AdBreakType>(value ? value : typeValue);
      });
  }
  /**
   * Parses an Ad break's AdSource.
   */
  private async parseSource(adBreakObj: any): Promise<VMAP.IAdSource> {
    const parsedSources: any[] = _.get<any[]>(adBreakObj, 'vmap:AdSource');

    if (!Array.isArray(parsedSources) || !parsedSources.length) {
      return undefined;
    }
    if (parsedSources.length > 1) {
      throw new Error('There can be only one <AdSource> per <AdBreak>');
    }
    return await this.parseSourceObj(parsedSources[0]);
  }
  /**
   * Parses an AdSource object.
   */
  private async parseSourceObj(adSourceObj: any): Promise<VMAP.IAdSource> {
    let adDataObj: any = [];
    const toBool = (value: any): any => {
      switch (value) {
        case 'true':
          return true;
        case 'false':
          return false;
        default:
          return 'Not a bool';
      }
    };
    const commonAttributes: any = {
      id: adSourceObj.id,
      allowMultipleAds: toBool(adSourceObj.allowMultipleAds),
      followRedirects: toBool(adSourceObj.followRedirects),
    };

    if (Array.isArray(adSourceObj['vmap:VASTAdData'])) {
      adDataObj = adDataObj.concat(adSourceObj['vmap:VASTAdData']);
      commonAttributes.dataType = VMAP.AdSourceTypes.VAST3;
    }
    if (Array.isArray(adSourceObj['vmap:CustomAdData'])) {
      adDataObj = adDataObj.concat(adSourceObj['vmap:CustomAdData']);
      commonAttributes.dataType = VMAP.AdSourceTypes.custom;
    }
    if (Array.isArray(adSourceObj['vmap:AdTagURI'])) {
      adDataObj = adDataObj.concat(adSourceObj['vmap:AdTagURI']);
      commonAttributes.dataType = VMAP.AdSourceTypes.adTagURI;
    }
    if (adDataObj.length !== 1) {
      throw new Error('There should be exactly one of <VASTAdData>, <CustomAdData> or <AdTagURI> ad data');
    }
    adDataObj = adDataObj[0];
    switch (commonAttributes.dataType) {
      case VMAP.AdSourceTypes.VAST3:
        return await this.parseVAST3AdSource(adDataObj, commonAttributes);
      case VMAP.AdSourceTypes.custom:
        return this.parseCustomAdSource(adDataObj, commonAttributes);
      case VMAP.AdSourceTypes.adTagURI:
        return this.parseAdTagURIAdSource(adDataObj, commonAttributes);
      default:
        throw new Error('There should be exactly one of <VASTAdData>, <CustomAdData> or <AdTagURI> ad data');
    }
  }
  /**
   * Parses a VAST3 AdSource.
   */
  private async parseVAST3AdSource(adDataObj: any, commonAttributes: any): Promise<VMAP.IAdSource> {
    const vast3Parser: VAST3Parser = new VAST3Parser(adDataObj);

    commonAttributes.VASTAdData = await vast3Parser.parse();
    return commonAttributes;
  }
  /**
   * Parses a custom AdSource.
   */
  private parseCustomAdSource(adDataObj: any, commonAttributes: any): VMAP.IAdSource {
    const isObject: boolean = ((
      Object.keys(adDataObj)
      .filter((attrName: string): boolean => (['$t', 'templateType'].indexOf(attrName) === -1))
      .length
    ) > 0);

    commonAttributes.adDataType = <VMAP.customAdSourceTypes>((<any>VMAP.customAdSourceTypes)[adDataObj.templateType]);
    commonAttributes.customAdData = isObject ? adDataObj : adDataObj['$t'];
    return <VMAP.IAdSource>commonAttributes;
  }
  /**
   * Parses a AdTagURI AdSource.
   */
  private parseAdTagURIAdSource(adDataObj: any, commonAttributes: any): VMAP.IAdSource {
    commonAttributes.adDataType = <VMAP.adTagURITypes>((<any>VMAP.adTagURITypes)[adDataObj.templateType]);
    commonAttributes.adTagURI = adDataObj['$t'];
    return <VMAP.IAdSource>commonAttributes;
  }
  /**
   * Parses an Ad break's TrackingEvents.
   */
  private parseTrackings(adBreakObj: any): VMAP.ITrackingEvent[] {
    const parsedTrackingEvents: any[] = _.get<any[]>(adBreakObj, 'vmap:TrackingEvents');
    let parsedTrackings: any[];

    if (Array.isArray(parsedTrackingEvents)) {
      if (parsedTrackingEvents.length > 1) {
        throw new Error('There can be only one <TrackingEvents> per <AdSource>');
      }
      if (parsedTrackingEvents.length) {
        parsedTrackings = _.get<any[]>(parsedTrackingEvents[0], 'vmap:Tracking');
        if (_.isArray(parsedTrackings)) {
          return parsedTrackings.map((trackingObj: any) => this.parseTracking(trackingObj))
            .filter((tracking: VMAP.ITrackingEvent): boolean => !!tracking);
        }
      }
    }
    return undefined;
  }
  /**
   * Parses a Tracking.
   */
  private parseTracking(trackingObj: any): VMAP.ITrackingEvent {
    return <VMAP.ITrackingEvent>{
      level: <VMAP.TrackingEvent>((<any>VMAP.TrackingEvent)[trackingObj.event]),
      uri: trackingObj['$t'],
    };
  }
  /**
   * Parses an Ad break's Extensions.
   */
  private parseExtensions(adBreakObj: any): VMAP.IExtension[] {
    const parsedExtensionsContainer: any[] = _.get<any[]>(adBreakObj, 'vmap:Extensions');
    let parsedExtension: any[];

    if (Array.isArray(parsedExtensionsContainer)) {
      if (parsedExtensionsContainer.length > 1) {
        throw new Error('There can be only one <Extensions> per <AdSource>');
      }
      if (parsedExtensionsContainer.length) {
        parsedExtension = _.get<any[]>(parsedExtensionsContainer[0], 'vmap:Extension');
        if (_.isArray(parsedExtension)) {
          return parsedExtension.map((extensionObj: any) => this.parseExtension(extensionObj))
            .filter((extension: VMAP.IExtension): boolean => !!extension);
        }
      }
    }
    return undefined;
  }
  /**
   * Parses an Extension.
   */
  private parseExtension(extensionObj: any): VMAP.IExtension {
    const isObject: boolean = ((
      Object.keys(extensionObj)
        .filter((attrName: string): boolean => (['$t', 'type'].indexOf(attrName) === -1))
        .length
    ) > 0);

    return <VMAP.IExtension>{
      extensionType: extensionObj.type,
      value: (isObject ? extensionObj : (extensionObj['$t'] || '')),
    };
  }
}

/* tslint:enable: no-any no-string-literal */
