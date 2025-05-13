import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  FormHelperText
} from '@mui/material';

// Define available languages for transcription
const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onChange: (language: string) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onChange,
  disabled = false
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth margin="normal" disabled={disabled}>
      <InputLabel id="transcription-language-label">Transcription Language</InputLabel>
      <Select
        labelId="transcription-language-label"
        id="transcription-language"
        value={selectedLanguage}
        label="Transcription Language"
        onChange={handleChange}
      >
        {AVAILABLE_LANGUAGES.map((language) => (
          <MenuItem key={language.code} value={language.code}>
            {language.name}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>
        Select the primary language spoken in your audio
      </FormHelperText>
    </FormControl>
  );
};

export default LanguageSelector; 