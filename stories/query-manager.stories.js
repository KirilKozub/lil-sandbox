// highlight.stories.js

import { html } from 'lit';
import '../src/query-manager/highlight-target.js';
import '../src/query-manager/query-input.js';

export default {
  title: 'Query Highlight/Scenarios',
};

export const BasicHighlighting = () => html`
  <query-input key="demo-basic" .options=${{
    splitWords: true,
    normalizers: 'default',
  }}></query-input>
  <highlight-target key="demo-basic">
    <div data-highlight>
      This is a test text with some words to highlight like apple and banana.
    </div>
  </highlight-target>
`;

export const WithExactMatch = () => html`
  <query-input key="demo-exact" .options=${{
    exactMatch: true,
    normalizers: 'default',
  }}></query-input>
  <highlight-target key="demo-exact">
    <div data-highlight>
      Try searching for "man" or "manly" and see the difference.
    </div>
  </highlight-target>
`;

export const CustomNormalizer = () => html`
  <query-input key="demo-custom" .options=${{
    splitWords: false,
    normalizers: [
      'default',
      (s) => s.replace(/a/g, 'o'),
    ],
  }}></query-input>
  <highlight-target key="demo-custom">
    <div data-highlight>
      A sentence with apple, banana and avocado inside.
    </div>
  </highlight-target>
`;

export const MultipleTargets = () => html`
  <query-input key="demo-multi" .options=${{
    splitWords: true,
  }}></query-input>
  <highlight-target key="demo-multi">
    <div data-highlight>
      First block with mango and pineapple.
    </div>
  </highlight-target>
  <highlight-target key="demo-multi">
    <div data-highlight>
      Second block includes banana and apple.
    </div>
  </highlight-target>
`;
