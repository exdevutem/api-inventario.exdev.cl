import {Client} from "@notionhq/client";
import {
  DatabaseObjectResponse,
  PageObjectResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse, UserObjectResponse
} from "@notionhq/client/build/src/api-endpoints";

export type findItemInDatabaseProps = {
  apiKey: string;
  inventoryId: string;
  startCursor?: string;
}

export const findItemInDatabase = async ({ apiKey, inventoryId, startCursor }: findItemInDatabaseProps) => {
  const notion = new Client({ auth: apiKey })
  const databaseResponse = await notion.databases.query({
    database_id: '314d6424bee1489a9f09a9b86a86ba1e',
    start_cursor: startCursor,
    filter: {
      and: [
        {
          property: 'Código Interno',
          rich_text: {
            equals: inventoryId,
          },
        }
      ]
    }
  })

  if(databaseResponse.results.length == 0) {
    return {
      error: 'No se encontró ese objeto'
    }
  }

  return {
    results: databaseResponse.results.map(processItem),
    has_more: databaseResponse.has_more,
    next_cursor: databaseResponse.next_cursor,
  }
}

type SelectColor = "default" | "gray" | "brown" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "red";

const processItem = (it: PageObjectResponse | PartialPageObjectResponse | PartialDatabaseObjectResponse | DatabaseObjectResponse) => {

  const pageObject = it as PageObjectResponse
  const props = pageObject.properties
  const id = it.id
  const name = props["Nombre"].type == 'title' ? props["Nombre"].title[0]?.plain_text : '--'
  const creator = props["Creado por"].type == 'created_by' ? {
    id: (props["Creado por"].created_by as UserObjectResponse).id,
    name: (props["Creado por"].created_by as UserObjectResponse).name,
    avatar: (props["Creado por"].created_by as UserObjectResponse).avatar_url
  } : null

  const box = props["ID caja"].type == 'rich_text' ? props["ID caja"].rich_text[0]?.plain_text : '--'
  const utem_code = props["Código UTEM"].type == 'rich_text' ? props["Código UTEM"].rich_text[0]?.plain_text : '--'
  const internal_code = props["Código Interno"].type == 'rich_text' ? props["Código Interno"].rich_text[0]?.plain_text : '--'
  const concept = props["Concepto"].type == 'rich_text' ? props["Concepto"].rich_text[0]?.plain_text : '--'
  const location_or_borrowed_by = props["Ubicación/Prestado a"].type == 'rich_text' ? props["Ubicación/Prestado a"].rich_text[0]?.plain_text : '--'
  const image = pageObject.cover?.type == 'external' ? pageObject.cover?.external.url : null

  const property = props["Propiedad"]?.type == 'select' ? {
    value: (props["Propiedad"].select)?.name as string | null,
    color: props["Propiedad"].select?.color as SelectColor | null,
  } : null;

  const designated_location = props["Area Ubicacion"]?.type == 'select' ? {
    value: (props["Area Ubicacion"].select)?.name as string | null,
    color: props["Area Ubicacion"].select?.color as SelectColor | null,
  } : null;

  const circumstance = props["Circunstancia"]?.type == 'select' ? {
    value: (props["Circunstancia"].select)?.name as string | null,
    color: props["Circunstancia"].select?.color as SelectColor | null,
  } : null;

  const status = props["Estado"]?.type == 'status' ? {
    value: (props["Estado"].status)?.name as string | null,
    color: props["Estado"].status?.color as SelectColor | null,
  } : null;

  return ({
    id,
    name,
    creator,
    box,
    utem_code,
    internal_code,
    concept,
    location_or_borrowed_by,
    image,
    property,
    designated_location,
    circumstance,
    status,
  });
}

export type listItemsInDatabaseProps = {
  apiKey: string;
  startCursor?: string;
  query?: string;
}

export const listItemsInDatabase = async ({ apiKey, startCursor, query }: listItemsInDatabaseProps) => {
  const notion = new Client({ auth: apiKey })
  const databaseResponse = await notion.databases.query({
    database_id: '314d6424bee1489a9f09a9b86a86ba1e',
    start_cursor: startCursor,
    filter: {
      and: query?.toUpperCase()?.startsWith('XDEV-') ? [{
        property: 'Código Interno',
        rich_text: {
          contains: query?.toUpperCase(),
        }
      }] : [
        {
          property: 'Código Interno',
          rich_text: {
            is_not_empty: true,
            equals: query?.toUpperCase()?.startsWith('XDEV-') ? query?.toUpperCase() : undefined,
          },
        },
        {
          property: 'Nombre',
          title: {
            contains: query || '',
          }
        }
      ],
    },
    page_size: 15,
  })


  return {
    results: databaseResponse.results.map(processItem),
    has_more: databaseResponse.has_more,
    next_cursor: databaseResponse.next_cursor,
  }
}