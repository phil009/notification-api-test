import { EntityManager, EntityTarget, DeepPartial } from 'typeorm';

export function createColumnSelections(
    entityManager: EntityManager,
    entityType: EntityTarget<unknown>,
    alias: string,
): string[] {
    return entityManager
        .getRepository(entityType)
        .metadata.columns.map((col) => `${alias}.${col.propertyName} as ${alias}_${col.databaseName}`);
}

export function toEntity<E>(
    entityManager: EntityManager,
    entityType: EntityTarget<E>,
    alias: string,
    row: { [key: string]: unknown },
): E {
    const repository = entityManager.getRepository(entityType);
    const data: { [key: string]: unknown } = {};
    let exists = false;
    repository.metadata.columns.forEach((column) => {
        const fieldName = `${alias}_${column.databaseName}`;
        if (!exists) {
            exists = fieldName in row;
        }
        data[column.propertyName] = row[fieldName];
    });
    if (!exists) return;
    const entity = repository.create(data as DeepPartial<E>);
    repository.metadata.allEmbeddeds.forEach((embed) => {
        const value = embed.create();
        embed.columns.forEach((col) => {
            if (col.transformer && !Array.isArray(col.transformer)) {
                value[col.propertyName] = col.transformer.from(data[col.propertyName]);
            } else {
                value[col.propertyName] = data[col.propertyName];
            }
        });
        (entity as unknown as { [key: string]: unknown })[embed.propertyName] = value;
    });
    return entity;
}
