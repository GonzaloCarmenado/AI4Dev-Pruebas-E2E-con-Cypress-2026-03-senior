/**
 * Feature: Position Details — Kanban Board
 *
 * Cubre los dos escenarios requeridos por el ejercicio:
 *   1. Carga de la página de Position
 *   2. Cambio de fase de un candidato mediante drag-and-drop
 *
 * Estrategia de stubbing:
 *   - cy.intercept stub las llamadas GET para aislar la UI del backend.
 *   - La llamada PUT se deja pasar (aliased) para verificar el contrato de API
 *     sin necesidad de un backend en ejecución.
 *
 * Datos de seed utilizados (backend/prisma/seed.ts):
 *   - Position id:1  → "Senior Full-Stack Engineer"
 *   - Steps de flow1 → Initial Screening (id:1), Technical Interview (id:2), Manager Interview (id:3)
 *   - Candidatos:    → John Doe (id:1, step:Technical), Jane Smith (id:2, step:Technical),
 *                       Carlos García (id:3, step:Initial Screening, applicationId:4)
 */

const BASE_API = 'http://localhost:3010';
const POSITION_ID = 1;

describe('Feature: Position Details — Kanban Board', () => {

  beforeEach(() => {
    // Given la UI recibe datos del servidor
    cy.intercept('GET', `${BASE_API}/positions/${POSITION_ID}/interviewFlow`, {
      fixture: 'interviewFlow.json',
    }).as('getInterviewFlow');

    cy.intercept('GET', `${BASE_API}/positions/${POSITION_ID}/candidates`, {
      fixture: 'candidates.json',
    }).as('getCandidates');

    cy.intercept('PUT', `${BASE_API}/candidates/*`, {
      statusCode: 200,
      body: { message: 'Candidate stage updated' },
    }).as('updateCandidateStage');

    cy.visit(`/positions/${POSITION_ID}`);
    cy.wait(['@getInterviewFlow', '@getCandidates']);
  });

  // ─── Escenario 1: Carga de la página ───────────────────────────────────────

  describe('Scenario: Page loads with position data', () => {

    it('displays the position title', () => {
      // Then el título de la posición es visible
      cy.get('h2').should('contain.text', 'Senior Full-Stack Engineer');
    });

    it('shows all interview stage columns', () => {
      // Then se muestran las tres columnas del flujo de entrevistas
      cy.contains('.card-header', 'Initial Screening').should('be.visible');
      cy.contains('.card-header', 'Technical Interview').should('be.visible');
      cy.contains('.card-header', 'Manager Interview').should('be.visible');
    });

    it('places candidate cards in their correct stage column', () => {
      // Then Carlos García está en Initial Screening
      cy.contains('.card-header', 'Initial Screening')
        .closest('.col-md-3')
        .within(() => {
          cy.contains('Carlos García').should('be.visible');
        });

      // Then John Doe y Jane Smith están en Technical Interview
      cy.contains('.card-header', 'Technical Interview')
        .closest('.col-md-3')
        .within(() => {
          cy.contains('John Doe').should('be.visible');
          cy.contains('Jane Smith').should('be.visible');
        });

      // Then Manager Interview no contiene candidatos
      cy.contains('.card-header', 'Manager Interview')
        .closest('.col-md-3')
        .within(() => {
          cy.get('[data-rbd-draggable-context-id]').should('not.exist');
        });
    });

    it('shows the back navigation button', () => {
      cy.contains('Volver a Posiciones').should('be.visible');
    });

  });

  // ─── Escenario 2: Cambio de fase ───────────────────────────────────────────

  describe('Scenario: Candidate stage change via drag-and-drop', () => {

    it('calls PUT /candidates/:id with correct payload when card is dragged', () => {
      // When Carlos García (draggable id:"3") se arrastra a Technical Interview (droppable index:1)
      cy.dragCandidate('3', '1');

      // Then el endpoint PUT recibe applicationId:4 y currentInterviewStep:2
      cy.wait('@updateCandidateStage').then((interception) => {
        expect(interception.request.url).to.include('/candidates/3');
        expect(interception.request.body).to.deep.equal({
          applicationId: 4,
          currentInterviewStep: 2,
        });
      });
    });

    it('moves the card to the destination column after drag', () => {
      // When Carlos García se arrastra a Technical Interview
      cy.dragCandidate('3', '1');

      cy.wait('@updateCandidateStage');

      // Then la tarjeta aparece en Technical Interview
      cy.contains('.card-header', 'Technical Interview')
        .closest('.col-md-3')
        .within(() => {
          cy.contains('Carlos García').should('be.visible');
        });

      // And ya no está en Initial Screening
      cy.contains('.card-header', 'Initial Screening')
        .closest('.col-md-3')
        .within(() => {
          cy.contains('Carlos García').should('not.exist');
        });
    });

  });

});
