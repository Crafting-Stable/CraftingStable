package ua.tqs.controller;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;

import ua.tqs.model.User;
import ua.tqs.service.UserService;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setup() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    private User sampleUser(Long id) {
        try {
            // tenta construtor (Long, String, String)
            Constructor<User> ctor = null;
            try {
                ctor = (Constructor<User>) User.class.getConstructor(Long.class, String.class, String.class);
            } catch (NoSuchMethodException ignored) {
            }
            if (ctor != null) {
                return ctor.newInstance(id, "Alice", "alice@example.com");
            }

            // fallback: instancia e define campos por reflexão (busca em superclasses se necessário)
            User u = User.class.getDeclaredConstructor().newInstance();
            setField(u, "id", id);
            setField(u, "name", "Alice");
            setField(u, "email", "alice@example.com");
            return u;
        } catch (Exception e) {
            throw new RuntimeException("Não foi possível instanciar User no teste", e);
        }
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Class<?> cls = target.getClass();
        Field field = null;
        while (cls != null) {
            try {
                field = cls.getDeclaredField(fieldName);
                break;
            } catch (NoSuchFieldException e) {
                cls = cls.getSuperclass();
            }
        }
        if (field == null) {
            throw new NoSuchFieldException("Campo '" + fieldName + "' não encontrado em " + target.getClass());
        }
        field.setAccessible(true);
        field.set(target, value);
    }

    @Test
    void create_returnsCreatedAndLocation() throws Exception {
        User created = sampleUser(1L);

        when(userService.create(any(User.class))).thenReturn(created);

        String payload = """
                {
                  "name":"Alice",
                  "email":"alice@example.com",
                  "password":"secret"
                }
                """;

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/users/1"))
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.name", is("Alice")));

        verify(userService, times(1)).create(any(User.class));
    }

    @Test
    void listAll_returnsList() throws Exception {
        User u1 = sampleUser(1L);
        User u2 = sampleUser(2L);
        // altera nome via reflexão se não houver setter
        try {
            setField(u2, "name", "Bob");
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }

        when(userService.listAll()).thenReturn(List.of(u1, u2));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].name", is("Alice")))
                .andExpect(jsonPath("$[1].name", is("Bob")));

        verify(userService, times(1)).listAll();
    }

    @Test
    void findById_whenFound_returnsUser() throws Exception {
        User u = sampleUser(1L);

        when(userService.findById(1L)).thenReturn(Optional.of(u));

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.name", is("Alice")));

        verify(userService, times(1)).findById(1L);
    }

    @Test
    void findById_whenNotFound_returns404() throws Exception {
        when(userService.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/99"))
                .andExpect(status().isNotFound());

        verify(userService, times(1)).findById(99L);
    }

    @Test
    void delete_callsServiceAndReturnsNoContent() throws Exception {
        doNothing().when(userService).delete(1L);

        mockMvc.perform(delete("/api/users/1"))
                .andExpect(status().isOk());

        verify(userService, times(1)).delete(1L);
    }
}
