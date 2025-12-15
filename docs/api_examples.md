## Example api calls

### Get Strategies list

```bash
curl -X 'GET' \
  'https://market-view-api-experimental-uat.apps.aks-d-cluster2-uks.azure.bgintdev.com/strategies' \
  -H 'accept: application/json' \
  -H 'accept-version: 1' \
  -H 'Authorization: Bearer ...'
```

Server response

```json
{
  "message": [
    {
      "strategy_asset_type": "Global Equity - Equity",
      "strategy": "LTGG",
      "strategy_code": "LTGG",
      "main_representative_portfolio_icon_code": "DPERS",
      "portfolios": [...]
    },
    {
      "strategy_asset_type": "US Equity - Equity",
      "strategy": "US Growth",
      "strategy_code": "USEQUITY",
      "main_representative_portfolio_icon_code": "VANGUS",
      "portfolios": [...]
    },
    {
      "strategy_asset_type": "Global Equity - Equity",
      "strategy": "Global Alpha",
      "strategy_code": "GLOBALALPHA",
      "main_representative_portfolio_icon_code": "VANGLOB",
      "portfolios": [...]
    },
    {
      "strategy_asset_type": "Japan - Equity",
      "strategy": "Japan Growth",
      "strategy_code": "JAPANGROWTH",
      "main_representative_portfolio_icon_code": "WFJAP",
      "portfolios": [...]
    },
    {
      "strategy_asset_type": "Global Equity - Equity",
      "strategy": "Positive Change",
      "strategy_code": "Positive Change",
      "main_representative_portfolio_icon_code": "OCPOSITIVE",
      "portfolios": [...]
    }
  ]
} 
```

### Get Stock from partial name

```bash
curl -X 'GET' \
  'https://market-view-api-experimental-uat.apps.aks-d-cluster2-uks.azure.bgintdev.com/stocks/universe?limit=10&search=appl' \
  -H 'accept: application/json' \
  -H 'accept-version: 1' \
  -H 'Authorization: Bearer ...'
```

Response body

```json
{
  "message": {
    "total_count": 37,
    "results": [
      "results": [
      {
        "sedol": "6021492",
        "company_name": "Aiphone Co.,Ltd.",
        "sector": "Electric Appliances",
        "industry": "Electric Appliances",
        "region": "Japanese",
        "country": "Japan"
      },
      {
        "sedol": "2046251",
        "company_name": "Apple",
        "sector": "Information Technology",
        "industry": "Technology Hardware, Storage & Peripherals",
        "region": "American",
        "country": "United States"
      },
      {
        "sedol": "BXRTX56",
        "company_name": "Apple Hospitality Reit",
        "sector": "Real Estate",
        "industry": "Hotel & Resort REITs",
        "region": "American",
        "country": "United States"
      }...
    ]
  }
}
```

### get strategy holdings

```bash
curl -X 'GET' \
  'https://market-view-api-experimental-uat.apps.aks-d-cluster2-uks.azure.bgintdev.com/investment-intelligence/portfolios/holdings?portfolio_identifier=INTALPHA&portfolio_identifier_type=strategy_code' \
  -H 'accept: application/json' \
  -H 'accept-version: 1' \
  -H 'Authorization: Bearer ...'
```

Response body

```json
{
  ...
  "holdings": {
    ...
    "instrument_holdings": [
      {
        "sedol": "BLDBN41",
        "company_name": "Atlas Copco A",
        "country": "Sweden",
        "sector": "Industrials",
        "industry": "Machinery"
        ...
      },
      {
        "sedol": "BNKCF01",
        "company_name": "Lumine Group Inc",
        "country": "Canada",
        "sector": "Information Technology",
        "industry": "Software",
        ...
      },
      {
        "sedol": "BZ01RF1",
        "company_name": "Demant A/S",
        "country": "Denmark",
        "sector": "Health Care",
        "industry": "Health Care Equipment & Supplies",
        ...
      }
    ],
    ...
  }
}
```

### Get watchlist holdings

```bash
curl -X 'GET' \
  'https://market-view-api-experimental-uat.apps.aks-d-cluster2-uks.azure.bgintdev.com/investors/watchlist?watchlist_name=watchlist' \
  -H 'accept: application/json' \
  -H 'accept-version: 1' \
  -H 'Authorization: Bearer ...'
```

Response body
```json

[
  {
    "sedol": "B29NF31",
    "company_name": "Franco-Nevada Corp",
    "country": "Canada",
    "sector": "Materials",
    "industry": "Metals & Mining"
  },
  {
    "sedol": "B01C1P6",
    "company_name": "Bank Central Asia",
    "country": "Indonesia",
    "sector": "Financials",
    "industry": "Banks"
  }
]
```

### Get Company Documents list

```bash
curl -X 'GET' \
  'https://market-view-api-dev.apps.aks-d-cluster2-uks.azure.bgintdev.com/companies/documents?company_identifier=2588173&company_identifier_type=sedol&start_date=2025-01-01&end_date=2025-12-31&limit=100' \
  -H 'accept: application/json' \
  -H 'accept-version: 1' \
  -H 'Authorization: Bearer … '
```


Response body

```json
{
  "message": {
    "documents": [
      {
        "global_doc_id": "SE-16527020",
        "date": "2025-12-05T16:30:00",
        "title": "Edited Transcript of MSFT.OQ shareholder or annual meeting 5-Dec-25 4:30pm GMT",
        "rdc_org_id": 26589,
        "company_name": "Microsoft Corp",
        "category": "external",
        "type": "external_investor_calls",
        "subtype": "all_other_external_calls",
        "variant": "Shareholder Meeting",
        "filename": "SE-16527020.txt"
      },
      {
        "global_doc_id": "SE-16563134",
        "date": "2025-12-02T22:35:00",
        "title": "Edited Transcript of MSFT.OQ presentation 2-Dec-25 10:35pm GMT",
        "rdc_org_id": 26589,
        "company_name": "Microsoft Corp",
        "category": "external",
        "type": "external_investor_calls",
        "subtype": "all_other_external_calls",
        "variant": "Conference Presentation",
        "filename": "SE-16563134.txt"
      },
      {
        "global_doc_id": "RL-R443431",
        "date": "2025-11-13",
        "title": "Microsoft and Gaza meeting",
        "author": "Punit Desai",
        "snippet": "The document details a meeting regarding Microsoft's response to allegations that its technologies were used by the Israeli military in ways that violated internal policies. It outlines the discussions led by Steve Lippman, who provided insights into Microsoft's governance structures, human rights due diligence efforts, and the company's shift towards monitoring sensitive customers rather than just sensitive use cases. The meeting concluded with a sense of reassurance about Microsoft's commitment to integrity and human rights, despite acknowledging the unique reputational risks it faces compared to competitors.",
        "rdc_org_id": 26589,
        "company_name": "Microsoft Corp",
        "category": "internal",
        "type": "internal_investment_reports",
        "url": "https://library.bgs.com/Home/Open?id=R443431"
      },
      {
        "global_doc_id": "ER-112697515858",
        "date": "2025-10-30",
        "title": "Reports Good F1Q Results, But Capacity Constraint Weighs Down Azure and Cloud Services Revenue Growth; Raises Capex Guidance",
        "author": "Mr. Brian J. Schwartz",
        "snippet": "Microsoft's F1Q results beat consensus estimates. Azure and other Cloud Services revenue grew 39% in CC, which is strong growth at a large scale, but a slight decel from last quarter. Additionally, the F2Q guidance for this metric implies further deceleration despite an easier y/y comparison. The i",
        "rdc_org_id": 26589,
        "company_name": "Microsoft Corp",
        "category": "external",
        "type": "broker_research",
        "filename": "112697515858.pdf"
      },
      {
        "global_doc_id": "SE-16526988",
        "date": "2025-10-29T21:30:00",
        "title": "Edited Transcript of MSFT.OQ earnings conference call or presentation 29-Oct-25 9:30pm GMT",
        "rdc_org_id": 26589,
        "company_name": "Microsoft Corp",
        "category": "external",
        "type": "external_investor_calls",
        "subtype": "earnings_calls",
        "variant": "Earning Conference Call/Presentation",
        "filename": "SE-16526988.txt"
      },
      {
        "global_doc_id": "FI-85165693",
        "date": "2025-10-29",
        "title": "Microsoft Corp 10-Q",
        "rdc_org_id": 26589,
        "company_name": "Microsoft Corp",
        "category": "external",
        "type": "filing_documents",
        "subtype": "interim_report",
        "variant": "10-Q",
        "filing_statement_date": "2025-09-30",
        "filename": "85165693.pdf"
      },
      …
]}}
```


### get company document text

```bash
curl -X 'GET' \
  'https://market-view-api-dev.apps.aks-d-cluster2-uks.azure.bgintdev.com/companies/documents/FI-85165693' \
  -H 'accept: application/json' \
  -H 'accept-version: 1' \
  -H 'Authorization: Bearer ...'
```
Response body

```json
{
  "global_doc_id": "FI-85165693",
  "title": "85165693.pdf",
  "category": "external",
  "type": "filing_documents",
  "pages": [
    {
      "page_no": 1,
      "text": "REFINITIV CORPORATE DISCLOSURES | www.refinitiv.com | Contact Us ©2025 Refinitiv. All rights reserved. Republication or redistribution of Refinitiv content, including by framing or similar means, is prohibited without the prior written consent of Refinitiv. 'Refinitiv' and the Refinitiv logo are registered trademarks of Refinitiv and its affiliated companies. 1/88 DELTA REPORT 10-Q MSFT - MICROSOFT CORP 10-Q - SEPTEMBER 30, 2025 COMPARED TO 10-Q - MARCH 31, 2025 TOTAL DELTAS 1356 CHANGES 237 DELETIONS 618 ADDITIONS 501 REFINITIV The following comparison report has been automatically generated"
    },
    {
      "page_no": 2,
      "text": "REFINITIV CORPORATE DISCLOSURES | www.refinitiv.com | Contact Us ©2025 Refinitiv. All rights reserved. Republication or redistribution of Refinitiv content, including by framing or similar means, is prohibited without the prior written consent of Refinitiv. 'Refinitiv' and the Refinitiv logo are registered trademarks of Refinitiv and its affiliated companies. 2/88 UNITED STATES SECURITIES AND EXCHANGE COMMISSION Washington, D.C. 20549 FORM 10-Q ☒ QUARTERLY REPORT PURSUANT TO SECTION 13 OR 15(d) OF THE SECURITIES EXCHANGE ACT OF 1934 For the Quarterly Period Ended March 31, September 30, 2025 OR ...
    },
    …
]
}
```