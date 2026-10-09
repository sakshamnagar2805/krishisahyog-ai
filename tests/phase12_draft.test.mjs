import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {validateDraft} from '../server/publication/draft.ts';
const base={kind:'SCHEME',sourceDocumentId:'123e4567-e89b-42d3-a456-426614174000',code:'PM_KISAN',title:'Official title',summary:'Verified text requires human inspection',authority:'Government Department',editorId:'editor-1'};
test('scheme draft accepts verified-source structure',()=>assert.doesNotThrow(()=>validateDraft(base)));
test('source UUID mandatory',()=>assert.throws(()=>validateDraft({...base,sourceDocumentId:'not-a-document'})));
test('policy type mandatory',()=>assert.throws(()=>validateDraft({...base,kind:'POLICY'})));
test('empty scheme summary rejected',()=>assert.throws(()=>validateDraft({...base,summary:''})));
test('code must be canonical',()=>assert.throws(()=>validateDraft({...base,code:'some arbitrary scheme'})));
