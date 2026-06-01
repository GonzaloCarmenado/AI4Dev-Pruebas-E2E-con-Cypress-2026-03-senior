// Comando personalizado para drag-and-drop con react-beautiful-dnd.
// rbd usa eventos de ratón (no HTML5 drag API), por lo que la secuencia
// mousedown → mousemove (pequeño) → mousemove (destino) → mouseup
// es el único approach confiable sin dependencias adicionales.
Cypress.Commands.add('dragCandidate', (draggableId, targetDroppableIndex) => {
  const draggableSelector = `[data-rbd-draggable-id="${draggableId}"]`;
  const droppableSelector = `[data-rbd-droppable-id="${targetDroppableIndex}"]`;

  cy.get(draggableSelector).then(($draggable) => {
    const { left, top, width, height } = $draggable[0].getBoundingClientRect();
    const srcX = left + width / 2;
    const srcY = top + height / 2;

    cy.get(droppableSelector).then(($droppable) => {
      const destRect = $droppable[0].getBoundingClientRect();
      const dstX = destRect.left + destRect.width / 2;
      const dstY = destRect.top + destRect.height / 2;

      cy.wrap($draggable)
        .trigger('mousedown', { button: 0, which: 1, clientX: srcX, clientY: srcY, force: true });

      cy.wait(100);

      cy.wrap($draggable)
        .trigger('mousemove', { button: 0, which: 1, clientX: srcX + 5, clientY: srcY, force: true });

      cy.wait(100);

      cy.get('body')
        .trigger('mousemove', { button: 0, which: 1, clientX: dstX, clientY: dstY, force: true });

      cy.wait(100);

      cy.get('body')
        .trigger('mouseup', { button: 0, which: 1, clientX: dstX, clientY: dstY, force: true });
    });
  });
});
